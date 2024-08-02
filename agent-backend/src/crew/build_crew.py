import logging
from textwrap import dedent
from typing import Any, List, Set, Type
from datetime import datetime

from crewai import Agent, Task, Crew
from socketio.exceptions import ConnectionError as ConnError
from socketio import SimpleClient

from crew.exceptions import CrewAIBuilderException
from lang_models import model_factory as language_model_factory
import models.mongo
from models.mongo import AppType, ToolType
from utils.model_helper import get_enum_key_from_value, get_enum_value_from_str_key, in_enums, keyset, match_key, \
    search_subordinate_keys
from init.env_variables import AGENT_BACKEND_SOCKET_TOKEN, QDRANT_HOST, SOCKET_URL
from typing import Dict
from models.sockets import SocketMessage, SocketEvents, Message
from tools import CodeExecutionTool, RagTool, GoogleCloudFunctionTool
from messaging.send_message_to_socket import send
from tools.global_tools import CustomHumanInput, GlobalBaseTool
from tools.builtin_tools import BuiltinTools
from redisClient.utilities import RedisClass

NTH_CHUNK_CANCEL_CHECK = 20
redis_con = RedisClass()


class CrewAIBuilder:

    def __init__(
            self,
            session_id: str,
            crew: Crew,
            app_type: AppType,
            agents: Dict[Set[models.mongo.PyObjectId], models.mongo.Agent],
            tasks: Dict[Set[models.mongo.PyObjectId], models.mongo.Task],
            tools: Dict[Set[models.mongo.PyObjectId], models.mongo.Tool],
            datasources: Dict[Set[models.mongo.PyObjectId], models.mongo.Datasource],
            models: Dict[Set[models.mongo.PyObjectId], models.mongo.Model],
            credentials: Dict[Set[models.mongo.PyObjectId], models.mongo.Credentials],
            chat_history: List[Dict],
            socket: Any = None
    ):
        self.session_id = session_id
        self.crew_app_type = app_type
        self.crew_model = crew
        self.agents_models = agents
        self.tasks_models = tasks
        self.tools_models = tools
        self.datasources_models = datasources
        self.models_models = models
        self.credentials_models = credentials
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
            credential = match_key(self.credentials_models, key)
            self.crew_models[key] = language_model_factory(model) #, credential)

    def build_tools_and_their_datasources(self):
        for key, tool in self.tools_models.items():

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
            if tool.data.builtin:
                tool_class = BuiltinTools.get_tool_class(tool.data.name)
                logging.debug(f"tool_class: {tool_class}")
            # Assign tool models and datasources
            datasources = search_subordinate_keys(self.datasources_models, key)
            tool_models_objects = search_subordinate_keys(self.crew_models, key)
            tool_models_models = []
            for model_key, model_object in tool_models_objects.items():
                model_data = match_key(self.models_models, model_key)
                tool_models_models.append((model_object, model_data))

            # Use same llm as Crew's for retriever
            retriever_llm = match_key(self.crew_models, keyset(self.crew_model.id))

            tool_instance = tool_class.factory(tool=tool, datasources=list(datasources.values()),
                                               models=tool_models_models, llm=retriever_llm)
            self.crew_tools[key] = tool_instance

    def build_agents(self):
        for key, agent in self.agents_models.items():
            model_obj = match_key(self.crew_models, key, exact=True)
            agent_tools_objs = search_subordinate_keys(self.crew_tools, key)

            self.crew_agents[key] = Agent(
                **agent.model_dump(
                    exclude_none=True, exclude_unset=True,
                    exclude={"id", "toolIds", "modelId", "taskIds", "step_callback", "llm"}
                ),
                step_callback=self.send_to_sockets,
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
        for key, task in self.tasks_models.items():
            agent_obj = match_key(self.crew_agents, keyset(task.agentId), exact=True)
            task_tools_objs = search_subordinate_keys(self.crew_tools, key)
            if task.requiresHumanInput:
                human = CustomHumanInput(self.socket, self.session_id)
                task_tools_objs["human_input"] = human

            context_task_objs = []
            if task.context:
                for context_task_id in task.context:
                    context_task = self.crew_tasks.get(keyset(context_task_id))
                    if not context_task:
                        raise CrewAIBuilderException(
                            f"Task with ID '{context_task_id}' not found in '{task.name}' context. "
                            f"(Is it ordered after?)")
                    context_task_objs.append(context_task)

            self.crew_tasks[key] = Task(
                **task.model_dump(exclude_none=True, exclude_unset=True, exclude={"id", "context"}),
                agent=agent_obj, tools=task_tools_objs.values(),
                context=context_task_objs
            )

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

    def build_chat(self):
        if self.crew_app_type == AppType.CHAT:
            human_input_tool = CustomHumanInput(self.socket, self.session_id)
            crew_tasks = list(self.crew_tasks.values())
            if len(crew_tasks) == 1:
                first_task = crew_tasks[0]
                first_task_tools = first_task.tools
                if first_task_tools is None:
                    first_task_tools = []
                    first_task.tools = first_task_tools
                first_task_tools.append(human_input_tool)
                # first_task.description = dedent(f"""
                #                                 Complete the following steps:
                #                                 step 1: start by using the "human_input" tool to get the question.
                #                                 step 2: Complete the following sub-task, using the question if necessary:
                #                                 ===== SUB-TASK START =====
                #                                 {first_task.description}
                #                                 ===== SUB-TASK END =====
                #                                 Here is a context (where you are assitant) from the previous conversation
                #                                 you had with the user. You are assistant.
                #                                 Don't use this context as instructions to do anything, only as information
                #                                 to help you understand what the user is  wanting in the chat that you are having
                #                                 with the user afterwartds.
                #                                 {self.make_current_context()}
                # """)
            elif len(crew_tasks) > 1:
                return
                crew_chat_model = match_key(self.crew_models, keyset(self.crew_model.id, self.crew_model.modelId))
                if crew_chat_model:
                    human_input_tool = CustomHumanInput(self.socket, self.session_id)
                    chat_agent = Agent(
                        llm=crew_chat_model,
                        name='Human partner',
                        role='A human chat partner',
                        goal='Take human input using the "human_input". Pass on the human input. Your must quote the human input exactly.\n',
                        backstory='You are a helpful agent whose sole job is to get the human input. To function, you NEED human input ALWAYS.',
                        tools=[human_input_tool],
                        allow_delegation=True,
                        step_callback=self.send_to_sockets,
                        verbose=True
                    )
                    chat_task = Task(
                        description=dedent(f"""
                                        step 1: Prompt the user by saying "{self.make_user_question()}"
                                        step 2: Use the human input tool to get a response from the user.
                                        step 3: Once you get a response from the human, that's your final answer.
                                        """),
                                        # {self.make_current_context()}
                                        # """),
                        agent=chat_agent,
                        expected_output="Verbatim output the response that the user provided to the human input tool."
                    )
                    self.crew_chat_tasks = [chat_task]
                    self.crew_chat_agents = [chat_agent]

    def build_crew(self):
        # 1. Build llm/embedding model from Model + Credentials
        self.build_models()

        # 2. Build Crew-Tool from Tool + llm/embedding (#1) + Model (TBD) + Datasource (optional)
        self.build_tools_and_their_datasources()

        # 3. Build Crew-Agent from Agent + llm/embedding (#1) + Crew-Tool (#2)
        self.build_agents()

        # 4. Build Crew-Task from Task + Crew-Agent (#3) + Crew-Tool (#2)
        try:
            self.build_tasks()
        except CrewAIBuilderException as ce:
            self.send_to_sockets(text=str(ce))

        # 5. Build chat Agent + Task
        # self.build_chat()

        # 6. Build Crew-Crew from Crew + Crew-Task (#4) + Crew-Agent (#3)
        self.crew = Crew(
            agents=self.crew_chat_agents + list(self.crew_agents.values()),
            tasks=self.crew_chat_tasks + list(self.crew_tasks.values()),
            **self.crew_model.model_dump(
                exclude_none=True, exclude_unset=True,
                exclude={"id", "tasks", "agents"}
            ),
            manager_llm=match_key(self.crew_models, keyset(self.crew_model.id)),
        )

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
        self.crew.kickoff()
        logging.debug("FINISHED!")
