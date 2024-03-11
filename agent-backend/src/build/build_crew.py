import logging
from typing import Set
from time import time
from uuid import uuid4

from crewai import Agent, Task, Crew
from socketio.exceptions import ConnectionError as ConnError
from socketio import SimpleClient

import models.mongo
from utils.model_helper import get_enum_key_from_value, get_enum_value_from_str_key, in_enums, keyset, match_key, \
    search_subordinate_keys
from init.env_variables import AGENT_BACKEND_SOCKET_TOKEN, QDRANT_HOST, SOCKET_URL
from typing import Dict
from langchain_openai.chat_models import ChatOpenAI, AzureChatOpenAI
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_core.agents import AgentFinish
from models.sockets import SocketMessage, SocketEvents, Message
from langchain_community.vectorstores.qdrant import Qdrant
from qdrant_client import QdrantClient
from tools import RagTool  # , RagToolFactory
from messaging.send_message_to_socket import send
from tools.global_tools import CustomHumanInput


class CrewAIBuilder:

    def __init__(
            self,
            session_id: str,
            crew: Crew,
            agents: Dict[Set[models.mongo.PyObjectId], models.mongo.Agent],
            tasks: Dict[Set[models.mongo.PyObjectId], models.mongo.Task],
            tools: Dict[Set[models.mongo.PyObjectId], models.mongo.Tool],
            datasources: Dict[Set[models.mongo.PyObjectId], models.mongo.Datasource],
            models: Dict[Set[models.mongo.PyObjectId], models.mongo.Model],
            credentials: Dict[Set[models.mongo.PyObjectId], models.mongo.Credentials]
    ):
        self.session_id = session_id
        self.crew_model = crew
        self.agents_models = agents
        self.tasks_models = tasks
        self.tools_models = tools
        self.datasources_models = datasources
        self.models_models = models
        self.credentials_models = credentials
        self.crew = None
        self.crew_models = dict()
        self.crew_tools = dict()
        self.crew_agents = dict()
        self.crew_tasks = dict()
        self.socket = SimpleClient()
        self.init_socket()

    def init_socket(self):
        try:
            # Initialize the socket client and connect
            print(f"Socker URL: {SOCKET_URL}")
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
                                    "embeddingLength"}
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
            datasource = match_key(self.datasources_models, key)
            if datasource:
                embedding_model = match_key(self.crew_models, key)
                embedding_model_model = match_key(self.models_models, key)
                # Avoid the model_name conversion in FastEmbed models instantiation
                if embedding_model:
                    collection = str(datasource.id)
                    self.crew_tools[key] = RagTool(
                        vector_store=Qdrant(
                            client=QdrantClient(QDRANT_HOST),
                            collection_name=collection,
                            embeddings=embedding_model,
                            vector_name=embedding_model_model.model_name,
                            content_payload_key=datasource.embeddingField
                        ),
                        embedding=embedding_model,
                        name=tool.name, description=tool.description)

    def build_agents(self):
        for key, agent in self.agents_models.items():
            model_obj = match_key(self.crew_models, key, exact=True)
            agent_tools_objs = search_subordinate_keys(self.crew_tools, key)
            human = CustomHumanInput(self.socket, self.session_id)
            agent_tools_objs["human_input"] = human
            print(agent_tools_objs.values())
            self.crew_agents[key] = Agent(
                **agent.model_dump(
                    exclude_none=True, exclude_unset=True,
                    exclude={"id", "toolIds", "modelId", "taskIds"}
                ),
                llm=model_obj, tools=agent_tools_objs.values()
            )

    def build_tasks(self):
        for key, task in self.tasks_models.items():
            agent_obj = match_key(self.crew_agents, keyset(task.agentId), exact=True)
            task_tools_objs = search_subordinate_keys(self.crew_tools, key)
            self.crew_tasks[key] = Task(
                **task.model_dump(exclude_none=True, exclude_unset=True, exclude={"id"}),
                agent=agent_obj, tools=task_tools_objs.values()
            )

    def build_crew(self):
        # 1. Build llm/embedding model from Model + Credentials
        self.build_models_with_credentials()

        # 2. Build Crew-Tool from Tool + llm/embedding (#1) + Model (TBD) + Datasource (optional)
        self.build_tools_and_their_datasources()

        # 3. Build Crew-Agent from Agent + llm/embedding (#1) + Crew-Tool (#2)
        self.build_agents()

        # 4. Build Crew-Task from Task + Crew-Agent (#3) + Crew-Tool (#2)
        self.build_tasks()

        # 5. Build Crew-Crew from Crew + Crew-Task (#4) + Crew-Agent (#3)
        self.crew = Crew(
            agents=self.crew_agents.values(), tasks=self.crew_tasks.values(),
            **self.crew_model.model_dump(
                exclude_none=True, exclude_unset=True,
                exclude={"id", "tasks", "agents"}
            ),
            step_callback=self.send_to_sockets
        )

    def send_to_sockets(self, text, event=SocketEvents.MESSAGE, first=True, chunkId=uuid4().hex):
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
                )
            ),
            "both"
        )

    def run_crew(self):
        try:
            self.crew.kickoff()
        except Exception as e:
            logging.exception(e)
