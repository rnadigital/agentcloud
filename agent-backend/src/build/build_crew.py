import importlib
import logging
from pprint import pprint

from crewai import Agent, Task, Crew
import langchain.tools
from socketio.exceptions import ConnectionError as ConnError
from socketio.simple_client import SimpleClient

import models.mongo
from init.env_variables import SOCKET_URL, AGENT_BACKEND_SOCKET_TOKEN
from typing import Optional, Union, List, Dict
from langchain_openai.chat_models import ChatOpenAI, AzureChatOpenAI
from tools.global_tools import GlobalTools


class CrewAIBuilder:
    def __init__(
            self,
            prompt: str,
            session_id: str,
            crew: Dict,
            crew_tasks: List[Dict],
            agents: List[Dict],
            agent_tasks: List[Dict],
            tools: List[Dict],
            llms: List[Dict],
            creds: List[Dict],
            history: Optional[List[Dict]],
    ):
        self.prompt: str = prompt
        self.crew = crew
        self.crew_tasks = crew_tasks
        self.agents = agents
        self.agent_tasks = agent_tasks
        self.tools = tools
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

    def attach_agents_to_tasks(self, agents: List[models.mongo.Agent]) -> List[Task]:
        try:
            """this method will iterate over all tasks and convert our mongo model into a crewAi Task object
        then it will attach the corresponding Agent (crewAi agent object) to the matching task"""
            return [
                Task(
                    **models.mongo.Task(**task).model_dump(exclude_none=True, exclude_unset=True),
                    agent=agents[j]
                )
                for j in range(len(self.agent_tasks))
                for task in self.agent_tasks[j]
            ]
        except Exception as e:
            logging.exception(e)

    def build_tool_objects(self) -> List[models.mongo.Tool]:
        list_tool_objects = [
            models.mongo.Tool(**tool)
            for n in range(len(self.tools))
            for tool in self.tools[n]
        ]

        for tool in list_tool_objects:
            if tool.data.builtin:
                print("TOOL", tool)
            #     load function from GlobalTools class
            else:
                pass
                # module = importlib.import_module('tools.base_tool')
                # base_tool_class = getattr(module, 'BaseTool')
                # init_base_tool_class = base_tool_class()
                # init_base_tool_class.tool(

    def attach_model_to_agent(self, agents: List[models.mongo.Agent]):
        try:
            mods: List[models.mongo.Model] = [models.mongo.Model(**model) for model in self.models]
            creds: List[models.mongo.Credentials] = [models.mongo.Credentials(**cred) for cred in self.creds]
            for i, v in enumerate(mods):
                c = models.mongo.ChatModel(
                    **v.model_dump(exclude_none=True)
                )
                c.api_key = creds[i].credentials.api_key
                c.base_url = creds[i].credentials.base_url
                agents[i].llm = ChatOpenAI(**c.model_dump(exclude_none=True, exclude_unset=True))
            return agents
        except Exception as e:
            logging.exception(e)

    def build_crewai_agents(self) -> List[Agent]:
        try:
            return [Agent(
                **models.mongo.Agent(**agent).model_dump(exclude_none=True, exclude_unset=True)
            ) for agent in self.agents]
        except Exception as e:
            logging.exception(e)

    def build_crew(self):
        try:
            agents: List[Agent] = self.build_crewai_agents()
            agents_with_models: List[Agent] = self.attach_model_to_agent(agents)
            tasks: List[Task] = self.attach_agents_to_tasks(agents_with_models)
            # todo: attach tools to agents
            # todo: attach tools to tasks
            tool_objects: List[models.mongo.Tool] = self.build_tool_objects()

            # Instantiate CrewAI Crew and attache agents and tasks
            crew = Crew(agents=agents_with_models, tasks=tasks, **models.mongo.Crew(**self.crew).model_dump(
                exclude_none=True,
                exclude={"agents", "tasks"}
            ))
            pprint(crew.model_dump())
            return crew
        except Exception as e:
            logging.exception(e)

    @staticmethod
    def run_crew(crew: Crew):
        try:
            crew.kickoff()
        except Exception as e:
            logging.exception(e)
