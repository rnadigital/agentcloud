import logging

from socketio.simple_client import SimpleClient
from init.env_variables import SOCKET_URL
import autogen
from typing import Optional, Union, List, Dict, Callable
from models.config_models import AgentConfig
from importlib import import_module
from pprint import pprint

class ChatBuilder:
    def __init__(self, prompt, session_id: str, group_chat: bool, history: Optional[dict]):
        self.user_proxy: Optional[autogen.UserProxyAgent] = None
        self.agents: Optional[List[Union[autogen.AssistantAgent, autogen.UserProxyAgent]]] = list()
        self.prompt: str = prompt
        self.history: Optional[dict] = history
        self.group_chat: bool = group_chat

        # Initialize the socket client and connect
        self.socket = SimpleClient()
        self.session_id = session_id
        self.socket.connect(url=SOCKET_URL)
        self.socket.emit("join_room", f"_{session_id}")

    def attach_tools_to_agent(self):
        try:
            for i, agent in enumerate(self.agents):
                agent_config: Dict = agent.llm_config
                if agent_config and len(agent_config) > 0:
                    functions: List[Dict] = agent_config.get("functions")
                    pprint(functions)
                    if functions and len(functions) > 0:
                        for function in functions:
                            func_name: str = f"{function.get('name')}"
                            try:
                                # Import the function from the tools directory
                                module = import_module("tools.global_tools")
                                func: Callable = getattr(module, func_name)
                            except ModuleNotFoundError as mnf:
                                logging.exception(mnf)
                                pass
                            # Register function associated with agent
                            agent.register_function(
                                function_map={
                                    func_name: func
                                }
                            )
                            self.agents[i] = agent
        except Exception as e:
            logging.exception(e)

    def create_group(self, roles: List):
        # Initialize agents
        for i, role in enumerate(roles):
            agent_type = getattr(autogen, role.get("type"))
            agent_config = role.get("data")
            agent_config["name"] = "admin" if role.get("is_admin") else agent_config.get("name")
            agent_config["socket_client"] = self.socket
            agent_config["sid"] = self.session_id
            _agent: AgentConfig = AgentConfig(**agent_config)
            agent: Union[autogen.AssistantAgent, autogen.UserProxyAgent] = agent_type(**_agent.model_dump())
            if agent.name == "admin":
                self.user_proxy = agent
            self.agents.append(agent)

    def run_chat(self):
        # Initialize group chat if required
        if self.group_chat:
            groupchat = autogen.GroupChat(agents=self.agents, messages=[], max_round=50)
            manager = autogen.GroupChatManager(groupchat=groupchat, llm_config=self.agents[0].llm_config, use_sockets=True,
                                               socket_client=self.socket, sid=self.session_id)
            if self.user_proxy:
                self.user_proxy.initiate_chat(recipient=manager, message=self.prompt, clear_history=True,
                                              **self.history)
        else:
            recipient = [agent for agent in self.agents if agent.name != 'admin']
            self.user_proxy.initiate_chat(recipient=recipient[0], message=self.prompt)
