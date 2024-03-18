import logging
from textwrap import dedent
from typing import List, Set, Type
from datetime import datetime

from crewai import Agent, Task, Crew
from socketio.exceptions import ConnectionError as ConnError
from socketio import SimpleClient

import models.mongo
from models.mongo import AppType, ToolType
from utils.model_helper import get_enum_key_from_value, get_enum_value_from_str_key, in_enums, keyset, match_key, \
    search_subordinate_keys
from init.env_variables import AGENT_BACKEND_SOCKET_TOKEN, QDRANT_HOST, SOCKET_URL
from typing import Dict
from langchain_openai.chat_models import ChatOpenAI, AzureChatOpenAI
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from models.sockets import SocketMessage, SocketEvents, Message
from tools import CodeExecutionTool, RagTool  # , RagToolFactory
from messaging.send_message_to_socket import send
from tools.global_tools import CustomHumanInput, GlobalBaseTool


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
            init_socket: bool = True
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
        self.crew = None
        self.crew_models = dict()
        self.crew_tools = dict()
        self.crew_agents = dict()
        self.crew_tasks = dict()
        self.socket = SimpleClient()
        self.crew_chat_tasks = list()
        self.crew_chat_agents = list()
        if init_socket:
            self.init_socket()

    def init_socket(self):
        try:
            # Initialize the socket client and connect
            print(f"Socket URL: {SOCKET_URL}")
            custom_headers = {"x-agent-backend-socket-token": AGENT_BACKEND_SOCKET_TOKEN}
            self.socket.connect(url=SOCKET_URL, headers=custom_headers)
            self.socket.emit("join_room", f"_{self.session_id}")
        except ConnError as ce:
            logging.error(f"Connection error occurred: {ce}")
            raise

    @staticmethod
    def fastembed_standard_doc_name_swap(fastembed_model_name: str, from_standard_to_doc: bool):
        from_enum = models.mongo.FastEmbedModelsStandardFormat if from_standard_to_doc else models.mongo.FastEmbedModelsDocFormat
        to_enum = models.mongo.FastEmbedModelsDocFormat if from_standard_to_doc else models.mongo.FastEmbedModelsStandardFormat
        if in_enums(enums=[to_enum], value=fastembed_model_name):
            return fastembed_model_name
        elif in_enums(enums=[from_enum], value=fastembed_model_name):
            return get_enum_value_from_str_key(
                to_enum,
                get_enum_key_from_value(
                    from_enum,
                    fastembed_model_name
                )
            )

    def build_models_with_credentials(self):
        for key, model in self.models_models.items():
            credential = match_key(self.credentials_models, key)
            if credential:
                match credential.type:
                    # todo: need to find a way to load these class dynamically rather than having all these switch statements
                    case models.mongo.Platforms.ChatOpenAI:
                        self.crew_models[key] = ChatOpenAI(
                            api_key=credential.credentials.api_key,
                            **model.model_dump(
                                exclude_none=True,
                                exclude_unset=True,
                                exclude={
                                    "id",
                                    "credentialId",
                                    "embeddingLength"
                                }
                            )
                        )
                    case models.mongo.Platforms.AzureChatOpenAI:
                        self.crew_models[key] = AzureChatOpenAI(
                            api_key=credential.credentials.api_key,
                            **model.model_dump(
                                exclude_none=True,
                                exclude_unset=True,
                                exclude={
                                    "id",
                                    "credentialId",
                                    "embeddingLength"
                                }
                            )
                        )
                    case models.mongo.Platforms.FastEmbed:
                        overwrite_model_name = self.fastembed_standard_doc_name_swap(
                            model.model_name,
                            from_standard_to_doc=True
                        )
                        self.crew_models[key] = FastEmbedEmbeddings(
                            **model.model_dump(exclude_none=True, exclude_unset=True,
                                               exclude={
                                                   "id",
                                                   "name",
                                                   "embeddingLength",
                                                   "model_name"}),
                            model_name=overwrite_model_name)

    def build_tools_and_their_datasources(self):
        for key, tool in self.tools_models.items():
            # Decide on tool class
            tool_class: Type[GlobalBaseTool] = None
            match tool.type:
                case ToolType.RAG_TOOL:
                    tool_class = RagTool
                case ToolType.HOSTED_FUNCTION_TOOL:
                    # TODO: use more secure option tools.CodeExecutionUsingDockerNotebookTool
                    tool_class = CodeExecutionTool
            # Assign tool models and datasources
            datasources = search_subordinate_keys(self.datasources_models, key)
            tool_models_objects = search_subordinate_keys(self.crew_models, key)
            tool_models_models = []
            for model_key, model_object in tool_models_objects.items():
                model_data = match_key(self.models_models, model_key)
                tool_models_models.append((model_object, model_data))
            tool_instance = tool_class.factory(tool=tool, datasources=list(datasources.values()),
                                               models=tool_models_models)
            self.crew_tools[key] = tool_instance

    def build_agents(self):
        for key, agent in self.agents_models.items():
            model_obj = match_key(self.crew_models, key, exact=True)
            agent_tools_objs = search_subordinate_keys(self.crew_tools, key)
            # human = CustomHumanInput(self.socket, self.session_id)
            # agent_tools_objs["human_input"] = human
            # print(agent_tools_objs.values())
            self.crew_agents[key] = Agent(
                **agent.model_dump(
                    exclude_none=True, exclude_unset=True,
                    exclude={"id", "toolIds", "modelId", "taskIds", "step_callback", "llm"}
                ),
                step_callback=self.send_to_sockets,
                llm=model_obj,
                tools=agent_tools_objs.values()
            )

    def build_tasks(self):
        for key, task in self.tasks_models.items():
            agent_obj = match_key(self.crew_agents, keyset(task.agentId), exact=True)
            task_tools_objs = search_subordinate_keys(self.crew_tools, key)
            self.crew_tasks[key] = Task(
                **task.model_dump(exclude_none=True, exclude_unset=True, exclude={"id"}),
                agent=agent_obj, tools=task_tools_objs.values()
            )

    def make_user_question(self):
        if self.chat_history and len(self.chat_history) > 0:
            return "and what else?"
        else:
            return "How can I help you?"

    def make_current_context(self):
        if self.chat_history and len(self.chat_history) > 0:
            return "\n".join(map(lambda chat: f"{chat.role}: {chat.content}", self.chat_history))
        else:
            return ""

    def make_task(self) -> Task:
        return

    def build_chat(self):
        if self.crew_app_type == AppType.CHAT:
            human_input_tool = CustomHumanInput(self.socket, self.session_id)
            crew_tasks = list(self.crew_tasks.values())
            if len(crew_tasks) == 1:
                # add human tool to first task agent
                # first_agent = crew_tasks[0].agent
                # if first_agent is not None:
                    # first_agent_tools = first_agent.tools
                    # if first_agent_tools is None:
                        # first_agent_tools = []
                        # first_agent.tools = first_agent_tools
                    # first_agent_tools.append(human_input_tool)
                first_task = crew_tasks[0]
                first_task_tools = first_task.tools
                if first_task_tools is None:
                    first_task_tools = []
                    first_task.tools = first_task_tools
                first_task_tools.append(human_input_tool)
            elif len(crew_tasks) > 1:
                crew_chat_model = match_key(self.crew_models, keyset(self.crew_model.id, self.crew_model.modelId))
                if crew_chat_model:
                    # human_input_tool = CustomHumanInput(self.socket, self.session_id)
                    chat_agent = Agent(
                        llm=crew_chat_model,
                        role='A human chat partner',
                        goal='Take human input using the "human_input". Pass on the human input. Your must quote the human input exactly.\n',
                        backstory='You are a helpful agent whose sole job is to get the himan input. To function, you NEED human input ALWAYS.',
                        tools=[human_input_tool],
                        allow_delegation=False,
                        step_callback=self.send_to_sockets,
                    )
                    chat_task = Task(
                        description=dedent(f"""
                                        You need to use the human tool. ALWAYS use the human tool.
                                        step 1: Prompt the user by saying "{self.make_user_question()}"
                                        step 2: use the human tool to get the human answer.
                                        step 3: Wait for that answer.
                                        step 4: Once you get the answer from the human, that's your final answer.
                                        {self.make_current_context()}
                                        """),
                        agent=chat_agent,
                        expected_output="Human request"
                    )
                    self.crew_chat_tasks = [chat_task]
                    self.crew_chat_agents = [chat_agent]

    def build_crew(self):
        # 1. Build llm/embedding model from Model + Credentials
        self.build_models_with_credentials()

        # 2. Build Crew-Tool from Tool + llm/embedding (#1) + Model (TBD) + Datasource (optional)
        self.build_tools_and_their_datasources()

        # 3. Build Crew-Agent from Agent + llm/embedding (#1) + Crew-Tool (#2)
        self.build_agents()

        # 4. Build Crew-Task from Task + Crew-Agent (#3) + Crew-Tool (#2)
        self.build_tasks()

        # 5. Build chat Agent + Task
        self.build_chat()
        # 6. Build Crew-Crew from Crew + Crew-Task (#4) + Crew-Agent (#3)
        self.crew = Crew(
            agents=self.crew_chat_agents + list(self.crew_agents.values()),
            tasks=self.crew_chat_tasks + list(self.crew_tasks.values()),
            **self.crew_model.model_dump(
                exclude_none=True, exclude_unset=True,
                exclude={"id", "tasks", "agents"}
            ),
            manager_llm = match_key(self.crew_models, keyset(self.crew_model.id)),
            verbose=True
        )

    def send_to_sockets(self, text=None, event=None, first=None, chunkId=None, timestamp=None, displayMessage=None):
        if text is None or len(text) == 0:
            text = ''
        if event is None:
            event = SocketEvents.MESSAGE
        if first is None:
            first = True
        if timestamp is None:
            timestamp = datetime.now().timestamp() * 1000

        send(
            self.socket,
            SocketEvents(event),
            SocketMessage(
                room=self.session_id,
                authorName="system",
                message=Message(
                    chunkId=chunkId,
                    text=text,
                    first=first,
                    tokens=1,
                    timestamp=timestamp,
                    displayMessage=displayMessage,
                )
            ),
            "both"
        )

    def run_crew(self):
        try:
            self.crew.kickoff()
        except Exception as e:
            logging.exception(e)
