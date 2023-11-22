import logging

from socketio.simple_client import SimpleClient
from init.env_variables import SOCKET_URL
import autogen
from typing import Optional, Union, List, Dict, Callable
from models.config_models import LLMConfig, AgentConfig, ConfigList
from importlib import import_module


class ChatBuilder:
    def __init__(self, prompt, session_id: str, group_chat: bool, history: Optional[dict]):
        self.user_proxy: Optional[autogen.UserProxyAgent] = None
        self.agents: Optional[List[Union[autogen.AssistantAgent, autogen.UserProxyAgent]]] = list()
        self.configs: Optional[List[Dict]] = list()
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
            if self.configs and len(self.configs) > 0:
                for i, agent in enumerate(self.agents):
                    functions: List[Dict] = self.configs[i].get("functions")
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

    def create_group(self, roles: List, function_config: List[Dict]):

        # Create configurations for each role
        for role in roles:
            config: LLMConfig = LLMConfig(
                config_list=[ConfigList(
                    api_key=role.get("key"),
                    api_type=role.get("platform"),
                    model=role.get("model")
                ).model_dump()],
                stream=True,
                functions=function_config
            )
            self.configs.append(config.model_dump(exclude_none=True))

        # Initialize agents
        for i, role in enumerate(roles):
            agent_type = getattr(autogen, role.get("type"))
            _agent: AgentConfig = AgentConfig(
                name="admin" if role.get("is_admin") else role.get("name"),
                llm_config=self.configs[i],
                system_message=role.get("system_message"),
                human_input_mode=role.get("human_input_mode") or "NEVER",
                code_execution_config=role.get('code_execution_config', False),
                socket_client=self.socket,
                sid=self.session_id,
            )
            agent: Union[autogen.AssistantAgent, autogen.UserProxyAgent] = agent_type(**_agent.model_dump())
            if agent.name == "admin":
                self.user_proxy = agent
            self.agents.append(agent)

    def run_chat(self):
        # Initialize group chat if required
        if self.group_chat:
            groupchat = autogen.GroupChat(agents=self.agents, messages=[], max_round=50)
            manager = autogen.GroupChatManager(groupchat=groupchat, llm_config=self.configs[0], use_sockets=True,
                                               socket_client=self.socket, sid=self.session_id)
            if self.user_proxy:
                self.user_proxy.initiate_chat(recipient=manager, message=self.prompt, clear_history=True,
                                              **self.history)
        else:
            recipient = [agent for agent in self.agents if agent.name != 'admin']
            self.user_proxy.initiate_chat(recipient=recipient[0], message=self.prompt)
