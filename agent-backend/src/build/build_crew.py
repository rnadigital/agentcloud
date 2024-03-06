import logging
from bson import ObjectId
import json

from crewai import Agent, Task, Crew
from socketio.exceptions import ConnectionError as ConnError
from socketio.simple_client import SimpleClient

import models.mongo
from init.env_variables import SOCKET_URL, AGENT_BACKEND_SOCKET_TOKEN, QDRANT_HOST
from typing import Optional, Union, List, Dict, Tuple
from langchain_openai.chat_models import ChatOpenAI, AzureChatOpenAI
from tools.global_tools import GlobalTools  # This needs to be used to instantiate tools that are not rag
from langchain.tools import Tool
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_core.agents import AgentFinish, AgentAction
from crewai.agents import CrewAgentParser
from models.sockets import SocketMessage, SocketEvents, Message
from langchain_community.vectorstores.qdrant import Qdrant
from qdrant_client import QdrantClient
from tools import RagToolFactory
from messaging.send_message_to_socket import send

class CrewAIBuilder:
    def __init__(
            self,
            prompt: str,
            session_id: str,
            crew: Dict,
            crew_tasks: List[Dict],
            agents: List[Dict],
            agent_tasks: List[Dict],
            agents_tools: List[Tuple],
            tools_datasources: Dict[str, Dict],
            llms: List[Dict],
            creds: List[Dict],
            history: Optional[List[Dict]],
    ):
        self.prompt: str = prompt
        self.crew = crew
        self.crew_tasks = crew_tasks
        self.agents = agents
        self.agent_tasks = agent_tasks
        self.agents_tools = agents_tools
        self.tools_datasources = tools_datasources
        self.models = llms
        self.creds = creds
        self.history: Optional[dict] = history
        try:
            # Initialize the socket client and connect
            self.socket = SimpleClient()
            self.session_id = session_id
            custom_headers = {"x-agent-backend-socket-token": AGENT_BACKEND_SOCKET_TOKEN}
            print(f"Socker URL:   {SOCKET_URL}")
            self.socket.connect(url=SOCKET_URL, headers=custom_headers)
            self.socket.emit("join_room", f"_{session_id}")
        except ConnError as ce:
            logging.error(f"Connection error occurred: {ce}")
            raise

    def attach_agents_to_tasks(self, agents: Dict[ObjectId, Agent]) -> List[Task]:
        # try:
            """this method will iterate over all tasks and convert our mongo model into a crewAi Task object
        then it will attach the corresponding Agent (crewAi agent object) to the matching task"""
            print(f"crew tasks: {self.crew_tasks}")
            tasks = [
                Task(
                    **models.mongo.Task(**task).model_dump(exclude_none=True, exclude_unset=True),
                    expected_output=task.get('expectedOutput'),
                    agent=agents[task["agentId"]]
                )
                for task in self.crew_tasks
            ]
            return tasks
        # except Exception as e:
            # logging.exception(e)

    def build_models(self):
        try:
            model_instances = []
            mods: List[models.mongo.Model] = [models.mongo.Model(**model) for model in self.models]
            creds: List[models.mongo.Credentials] = [models.mongo.Credentials(**cred) for cred in self.creds]
            for i, v in enumerate(mods):
                c = models.mongo.ChatModel(
                    **v.model_dump(exclude_none=True)
                )
                c.api_key = creds[i].credentials.api_key
                c.base_url = creds[i].credentials.base_url
                model_instances.append(ChatOpenAI(**c.model_dump(exclude_none=True, exclude_unset=True)))
            return model_instances
        except Exception as e:
            logging.exception(e)

    def build_agent_tools(self):
        """This method build the langchain tool and attaches to the correct resource"""
        agents_tools = {}
        for tool_agent_id, tools in self.agents_tools:
            if tools is not None:
                tool_models: List[Tool] = [
                    models.mongo.Tool(**tool)
                    for tool in tools
                ]
                for tool in tool_models:  # whis tool a Dict not a model????
                    # we need to take rag specific logic outside to another function that deals with datasources and embedding and auth
                    if tool.type == "rag" and tool.datasourceId is not None:
                        for ds_agent_id, datasources in self.tools_datasources:
                            if ds_agent_id == tool_agent_id:
                                for ds in datasources:
                                    if str(ds["_id"]) == str(tool.datasourceId) and (
                                            "connectionId" not in ds or ds["connectionId"] is None):
                                        tool_factory = RagToolFactory()
                                        collection = str(ds["_id"])
                                        embedding = FastEmbedEmbeddings(model_name="BAAI/bge-small-en")
                                        tool_factory.init(
                                            Qdrant(
                                                QdrantClient(QDRANT_HOST),
                                                collection_name=collection,
                                                embeddings=embedding),
                                            embedding
                                        )
                                        tool_instance = tool_factory.generate_langchain_tool(tool.name,
                                                                                             tool.description)
                                        if tool_agent_id in agents_tools:
                                            agents_tools[tool_agent_id].append(tool_instance)
                                        else:
                                            agents_tools[tool_agent_id] = [tool_instance]
        return agents_tools

    def build_crewai_agents(self, model_instances: List, agent_tools: Dict[str, Tool]) -> Dict[ObjectId, Agent]:
        try:
            agent_instances = {}
            for i, v in enumerate(self.agents):
                agent = Agent(
                    **models.mongo.Agent(**v).model_dump(exclude_none=True, exclude_unset=True, exclude="llm"),
                    llm=model_instances[i],
                    tools=agent_tools[v["_id"]] if v["_id"] in agent_tools else []
                )
                agent_instances[v["_id"]] = agent
            return agent_instances
        except Exception as e:
            logging.exception(e)

    def send_it(self, event, message, first):
        socket_message = SocketMessage(
            room=self.session_id,
            authorName="system",
            message=Message(
                text=message,
                chunkId="x",
                tokens=1,
                first=first,
            )
        )
        send(self.socket, SocketEvents(event), socket_message, "both")

    def build_crew(self):
        try:
            # agents_with_models: List[Agent] = self.attach_model_to_agent(self.agents)
            model_instances = self.build_models()
            agent_tools = self.build_agent_tools()
            # self.attach_model_to_agent(self.agents)
            agents: Dict[ObjectId, Agent] = self.build_crewai_agents(model_instances, agent_tools)
            tasks: List[Task] = self.attach_agents_to_tasks(agents)

            # Instantiate CrewAI Crew and attache agents and tasks
            crew = Crew(step_callback=self.send_it, agents=agents.values(), tasks=tasks, **models.mongo.Crew(**self.crew).model_dump(
                exclude_none=True,
                exclude={"agents", "tasks"}
            ))
            return crew
        except Exception as e:
            logging.exception(e)

    def run_crew(self, crew: Crew):
        try:
            res = crew.kickoff()
        except Exception as e:
            logging.exception(e)
