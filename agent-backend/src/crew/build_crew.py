from io import BytesIO
import json
import logging
import uuid
from typing import Any, List, Set, Type, Optional
from pprint import pprint
from datetime import datetime

from crewai import Agent, Task, Crew
from pydantic import ValidationError
from socketio.exceptions import ConnectionError as ConnError
from socketio import SimpleClient

from crew.build_task_helpers import (
    _update_variables_from_output, _upload_task_output, get_output_variables, get_task_tools, get_context_tasks, make_task_callback, get_output_pydantic_model
)
from crew.exceptions import CrewAIBuilderException
from lang_models import model_factory as language_model_factory
import models.mongo
from models.mongo import AppType, ToolType
from init.mongo_session import start_mongo_session
from utils.model_helper import keyset, match_key, search_subordinate_keys
from init.env_variables import AGENT_BACKEND_SOCKET_TOKEN, SOCKET_URL
from typing import Dict
from models.sockets import SocketMessage, SocketEvents, Message
from tools import RagTool, GoogleCloudFunctionTool
from messaging.send_message_to_socket import send
from tools.global_tools import GlobalBaseTool
from tools.builtin_tools import BuiltinTools
from redisClient.utilities import RedisClass
from storage import storage_provider 

mongo_client = start_mongo_session()

NTH_CHUNK_CANCEL_CHECK = 20
redis_con = RedisClass()


class CrewAIBuilder:

    def __init__(
            self,
            session_id: str,
            session: models.mongo.Session,
            crew: Crew,
            app_type: AppType,
            agents: Dict[Set[models.mongo.PyObjectId], models.mongo.Agent],
            tasks: Dict[Set[models.mongo.PyObjectId], models.mongo.Task],
            tools: Dict[Set[models.mongo.PyObjectId], models.mongo.Tool],
            datasources: Dict[Set[models.mongo.PyObjectId], models.mongo.Datasource],
            models: Dict[Set[models.mongo.PyObjectId], models.mongo.Model],
            input_variables: Optional[Dict[str, str]],
            chat_history: List[Dict],
            socket: Any = None
    ):
        self.session_id = session_id
        self.session = session
        self.crew_app_type = app_type
        self.crew_model = crew
        self.agents_models = agents
        self.tasks_models = tasks
        self.tools_models = tools
        self.datasources_models = datasources
        self.models_models = models
        self.input_variables = input_variables
        self.chat_history = chat_history
        self.socket = socket
        self.crew = None
        self.crew_models = dict()
        self.crew_tools = dict()
        self.crew_agents = dict()
        self.crew_tasks = dict()
        self.crew_chat_tasks = list()
        self.crew_chat_agents = list()
        self.num_tasks = len(tasks)
        self.output_variables = list()
        if socket is None:
            self.socket = SimpleClient()
            self.init_socket()

    def init_socket(self):
        try:
            # Initialize the socket client and connect
            logging.debug(f"Socket URL: {SOCKET_URL}")
            custom_headers = {"x-agent-backend-socket-token": AGENT_BACKEND_SOCKET_TOKEN}
            self.socket.connect(url=SOCKET_URL, headers=custom_headers)
            self.socket.emit("join_room", f"_{self.session_id}")
        except ConnError as ce:
            logging.error(f"Connection error occurred: {ce}")
            raise

    def build_models(self):
        for key, model in self.models_models.items():
            self.crew_models[key] = language_model_factory(model)  # , credential)

    def build_tools_and_their_datasources(self):
        for key, tool in self.tools_models.items():
            model_id = None
            for _, agent in self.agents_models.items():
                if tool.id in agent.toolIds:
                    model_id = agent.modelId
                    break

            # testing
            # if tool.data.builtin == True:
            #     self.crew_tools[key] = globals()[tool.data.name]
            #     continue

            # Decide on tool class
            tool_class: Type[GlobalBaseTool] = None
            match tool.type:
                case ToolType.RAG_TOOL:
                    tool_class = RagTool
                case ToolType.HOSTED_FUNCTION_TOOL:
                    tool_class = GoogleCloudFunctionTool
                case ToolType.BUILTIN_TOOL:
                    tool_name = tool.data.name
                    if tool.linkedToolId:
                        linked_tool = mongo_client.get_tool(tool.linkedToolId)
                        if linked_tool:
                            tool_name = linked_tool.data.name
                        else:
                            logging.warning(f"linked tool ID {tool.linkedToolId} not found for installed tool {tool.id}")
                    tool_class = BuiltinTools.get_tool_class(tool_name)
            # Assign tool models and datasources
            datasources = search_subordinate_keys(self.datasources_models, key)
            tool_models_objects = search_subordinate_keys(self.crew_models, key)
            tool_models_models = []
            for model_key, model_object in tool_models_objects.items():
                model_data = match_key(self.models_models, model_key)
                tool_models_models.append((model_object, model_data))

            # Use same llm as Crew's for retriever
            retriever_llm = match_key(self.crew_models, keyset(model_id))

            tool_instance = tool_class.factory(tool=tool, datasources=list(datasources.values()),
                                               models=tool_models_models, llm=retriever_llm)
            self.crew_tools[key] = tool_instance

    def build_agents(self):
        for key, agent in self.agents_models.items():
            model_obj = match_key(self.crew_models, key, exact=True)
            agent_tools_objs = search_subordinate_keys(self.crew_tools, key)
            self.crew_agents[key] = Agent(
                **agent.model_dump(
                    by_alias=True,
                    exclude_none=True,
                    # exclude_unset=True,
                    exclude={"id", "toolIds", "modelId", "taskIds", "step_callback", "llm"}
                ),
                stop_generating_check=self.stop_generating_check,
                llm=model_obj,
                tools=agent_tools_objs.values(),
            )

    def stop_generating_check(self):
        try:
            stop_flag = redis_con.get(f"{self.session_id}_stop")
            logging.debug(f"stop_generating_check for session: {self.session_id}, stop_flag: {stop_flag}")
            return stop_flag == "1"
        except:
    
            return False

    def build_tasks(self):
        print(self.tasks_models.items())
        for key, task in self.tasks_models.items():
            agent_obj = match_key(self.crew_agents, keyset(task.agentId), exact=True)

            task_tools_objs = get_task_tools(task, self.crew_tools)
            
            # if task_tools_objs:
            #     for tool_id, tool in task_tools_objs.items():
            #         if hasattr(tool, 'type') and tool.type == "rag":
            #             task_tools_objs[tool_id] = self.wrap_rag_tool_with_agent_llm(tool, agent_obj)

            context_task_objs = get_context_tasks(task, self.crew_tasks)

            self.output_variables.extend(get_output_variables(task))

            task_callback = make_task_callback(
                task=task,
                session=self.session,
                mongo_client=mongo_client,
                send_to_socket_fn=self.send_to_sockets,
                output_variables=self.output_variables,
            )


            output_pydantic_model = None
            if task.isStructuredOutput:
                output_pydantic_model = get_output_pydantic_model(task)
                task.expected_output =''

            self.crew_tasks[key] = Task(
                **task.model_dump(exclude_none=True, exclude_unset=True, exclude={
                    "id", "context", "requiresHumanInput", "displayOnlyFinalOutput",
                    "storeTaskOutput", "taskOutputFileName", "isStructuredOutput", "taskOutputVariableName" 
                }),
                agent=agent_obj,
                tools=list(task_tools_objs.values()) if task_tools_objs else [],
                context=context_task_objs,
                human_input=task.requiresHumanInput,
                stream_only_final_output=task.displayOnlyFinalOutput,
                callback=task_callback,
                output_pydantic=output_pydantic_model,
            )
            # Print the task callback for each task in self.crew_tasks
        for task_key, task in self.crew_tasks.items():
            print(f"Task Callback for {task_key}: {task.callback}")
    

    # def wrap_rag_tool_with_agent_llm(self, tool, agent):
    #     """
    #     Wraps a RAG tool to use the agent's LLM for query formatting.
        
    #     Args:
    #         tool: The RAG tool to wrap
    #         agent: The agent whose LLM will be used for query formatting
    #     """
    #     original_run = tool.run
        
    #     def wrapped_run(*args, **kwargs):
    #         if 'input' in kwargs:
    #             query_prompt = f"""Format the following task or question into a clear, concise search query.
    #             Task/Question: {kwargs.get('input', '')}
    #             Format the query to be most effective for retrieving relevant information."""
                
    #             formatted_query = agent.llm.invoke(query_prompt)
    #             kwargs['query'] = formatted_query
                
    #         return original_run(*args, **kwargs)
        
    #     tool.run = wrapped_run
    #     return tool

    def make_user_question(self):
        if self.chat_history and len(self.chat_history) > 0:
            return "and what else?"
        else:
            return "How can I help you?"

    def make_current_context(self):
        if self.chat_history and len(self.chat_history) > 0:
            return "=== START of Current context: ===\n" + "\n".join(map(
                lambda chat: f"""{chat["role"]}: {chat["content"]}""",
                filter(
                    lambda chat: "role" in chat and "content" in chat and len(chat["content"]) > 0 and len(
                        chat["role"]) > 0,
                    self.chat_history
                )
            )) + "\n=== END of Current context: ===\n"
        else:
            return ""

    def make_task(self) -> Task:
        return

    def build_crew(self):
        # 1. Build llm/embedding model from Model + Credentials
        self.build_models()

        # 2. Build Crew-Tool from Tool + llm/embedding (#1) + Model (TBD) + Datasource (optional)
        try:
            self.build_tools_and_their_datasources()
        except AssertionError as te:
            self.send_to_sockets(text=f"""Error:
            ```
            {str(te)}
            ```
            """, event=SocketEvents.MESSAGE, first=True, chunk_id=str(uuid.uuid4()),
                                 timestamp=datetime.now().timestamp() * 1000, display_type="bubble")

        # 3. Build Crew-Agent from Agent + llm/embedding (#1) + Crew-Tool (#2)
        self.build_agents()

        # 4. Build Crew-Task from Task + Crew-Agent (#3) + Crew-Tool (#2)
        try:
            self.build_tasks()
        except CrewAIBuilderException as ce:
            self.send_to_sockets(text=f"""Error:
            ```
            {str(ce)}
            ```
            """, event=SocketEvents.MESSAGE, first=True, chunk_id=str(uuid.uuid4()),
                                 timestamp=datetime.now().timestamp() * 1000, display_type="bubble")

        try:
            # 6. Build Crew-Crew from Crew + Crew-Task (#4) + Crew-Agent (#3)
            self.crew = Crew(
                agents=self.crew_chat_agents + list(self.crew_agents.values()),
                tasks=self.crew_chat_tasks + list(self.crew_tasks.values()),
                **self.crew_model.model_dump(
                    exclude_none=True, exclude_unset=True,
                    exclude={"id", "tasks", "agents", "managerModelId"}
                ),
                manager_llm=self.crew_models.get('manager_llm'),
                agentcloud_socket=self.socket,
                agentcloud_session_id=self.session_id,
                stop_generating_check=self.stop_generating_check,
            )
            
            def interplote_inputs_with_session_variables():
                current_session = mongo_client.get_session(self.session_id)
                if current_session is not None and current_session.variables:
                    self.crew._interpolate_inputs(current_session.variables)

            self.crew.task_callback = interplote_inputs_with_session_variables 
                
            
            print('---')
            print('Crew attributes:')
            pprint(self.crew.__dict__)
            print('---')
        except ValidationError as ve:
            logging.error(ve)
            self.send_to_sockets(text=f"""Validation Error:
            ``` 
            {str(ve)}
            ```
            """, event=SocketEvents.MESSAGE, first=True, chunk_id=str(uuid.uuid4()),
                                 timestamp=datetime.now().timestamp() * 1000, display_type="bubble")

    def send_to_sockets(self, text='', event=SocketEvents.MESSAGE, first=True, chunk_id=None,
                        timestamp=None, display_type='bubble', author_name='System', overwrite=False):

        if type(text) != str:
            text = "NON STRING MESSAGE"

        # Set default timestamp if not provided
        if timestamp is None:
            timestamp = int(datetime.now().timestamp() * 1000)

        # send the message
        send(
            self.socket,
            SocketEvents(event),
            SocketMessage(
                room=self.session_id,
                authorName=author_name,
                message=Message(
                    chunkId=chunk_id,
                    text=text,
                    first=first,
                    tokens=1,
                    timestamp=timestamp,
                    displayType=display_type,
                    overwrite=overwrite,
                )
            ),
            "both"
        )

    def run_crew(self):
        crew_output = self.crew.kickoff(inputs=self.input_variables if self.input_variables else None)

        if self.crew_model.fullOutput:  # Note: do we need/want this check?
            self.send_to_sockets(
                text=crew_output.raw,
                event=SocketEvents.MESSAGE,
                chunk_id=str(uuid.uuid4()),
            )

        self.send_to_sockets(
            text='',
            event=SocketEvents.STOP_GENERATING,
            chunk_id=str(uuid.uuid4()),
        )
