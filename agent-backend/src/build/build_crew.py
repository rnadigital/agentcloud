import logging

import crewai.agent
import langchain.tools
from bson import ObjectId
from socketio.exceptions import ConnectionError as ConnError
from socketio.simple_client import SimpleClient

import models.mongo
from init.env_variables import SOCKET_URL, BASE_PATH, AGENT_BACKEND_SOCKET_TOKEN, LOCAL, QDRANT_HOST
from typing import Optional, Union, List, Dict, Callable, Literal
from models.mongo import Crew, Agent, Tool, Task, Model, Credentials, Process
from langchain_openai import ChatOpenAI
from langchain_community.chat_models import *


class CrewBuilder:
    def __init__(
            self,
            prompt: str,
            session_id: str,
            crew: Crew,
            crew_tasks: List[Dict],
            agents: List[Dict],
            agent_tasks: List[Dict],
            tools: List[Dict],
            model: List[Dict],
            creds: List[Dict],
            history: Optional[List[Dict]],
    ):
        self.prompt: str = prompt
        self.crew = crew
        self.crew_tasks = crew_tasks
        self.agents = agents
        self.agent_tasks = agent_tasks
        self.tools = tools
        self.model = model
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

    def build_crewai_agent_tasks(self) -> List[crewai.Task]:
        return [crewai.task.Task(
            **models.mongo.Task(**task).model_dump(exclude_none=True, exclude_unset=True)
        ) for task in self.agent_tasks]

    def build_crewai_agents(self) -> List[crewai.Agent]:
        try:
            return [crewai.Agent(
                **models.mongo.Agent(**agent).model_dump(exclude_none=True, exclude_unset=True)
            ) for agent in self.agents]
        except Exception as e:
            logging.exception(e)

    def build_langchain_tools(self) -> List[langchain.tools.Tool]:
        pass

    def build_crew(self):
        try:
            # todo: Agents requires a model when instantiating. Need to configure model before we initialise Agent object
            agents: List[crewai.Agent] = self.build_crewai_agents()
            tasks: List[crewai.Task] = self.build_crewai_agent_tasks()
            tools: List[langchain.tools.Tool] = self.build_langchain_tools()
            return agents, tasks
        except Exception as e:
            logging.exception(e)

    def run_crew(self, agents: List[crewai.Agent], tasks: List[crewai.Task]):
        pass
