import logging

import crewai.agent
from socketio.exceptions import ConnectionError as ConnError
from socketio.simple_client import SimpleClient
from init.env_variables import SOCKET_URL, BASE_PATH, AGENT_BACKEND_SOCKET_TOKEN, LOCAL, QDRANT_HOST
from typing import Optional, Union, List, Dict, Callable, Literal
from models.mongo import Crew, Agent, Tool, Task, Model, Credentials, Process


class CrewBuilder:
    def __init__(
            self,
            prompt: str,
            session_id: str,
            crew: Crew,
            crew_tasks: List[Task],
            agents: List[Agent],
            agent_tasks: List[Task],
            tools: List[Tool],
            model: List[Model],
            creds: List[Credentials],
            history: Optional[dict],
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

    @staticmethod
    def build_crewai_task(task: str, agent: Optional[Agent]):
        return crewai.task.Task(
            description=task,
            agent=agent
        )

    def build_crewai_agent(self):
        for agent in self.agents:
            crewai.agent.Agent(

            )

    def build_crew(self):
        pass

    def run_crew(self):
        pass
