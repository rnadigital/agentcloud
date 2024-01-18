import logging

from socketio.simple_client import SimpleClient
from init.env_variables import SOCKET_URL, BASE_PATH, AGENT_BACKEND_SOCKET_TOKEN
import autogen
from typing import Optional, Union, List, Dict, Callable
from models.mongo import AgentConfig
from importlib import import_module


# TODO: Need to make this more modular so that a team can be constructed that included an agent that has an LLMConfig of
# tha function definition and another agent that has no LLMConfig but has the function registered in their func_map


class ChatBuilder:
    def __init__(
        self,
        prompt,
        session_id: str,
        group: dict,
        single_agent: bool,
        history: Optional[dict],
    ):
        self.user_proxy: Optional[autogen.UserProxyAgent] = None
        self.agents: Optional[
            List[Union[autogen.AssistantAgent, autogen.UserProxyAgent]]
        ] = list()
        self.single_agent = single_agent
        self.group = group
        self.prompt: str = prompt
        self.history: Optional[dict] = history
        self.group_chat: bool = group.get("group_chat") if group else False
        self.function_map = dict()

        # Initialize the socket client and connect
        self.socket = SimpleClient()
        self.session_id = session_id
        custom_headers = {"x-agent-backend-socket-token": AGENT_BACKEND_SOCKET_TOKEN}
        self.socket.connect(url=SOCKET_URL, headers=custom_headers)
        self.socket.emit("join_room", f"_{session_id}")

    def build_function_map(self):
        for agent in self.agents:
            agent_config: Dict = agent.llm_config
            if agent_config and len(agent_config) > 0:
                functions: List[Dict] = agent_config.get("functions")
                if functions and len(functions) > 0:
                    for function in functions:
                        if not function.get("builtin"):
                            func_name: str = f"{function.get('name')}"
                            func_code: str = function.get("code")
                            self.function_map.update({func_name: func_code})

        self.write_function_code_to_file()

    def write_function_code_to_file(self):
        try:
            if self.function_map and len(self.function_map) > 0:
                functions = "\n".join([v + "\n" for v in self.function_map.values()])
                if functions and len(functions) > 0:
                    with open(f"{BASE_PATH}/tools/{self.session_id}.py", "w") as f:
                        f.write(functions)
        except Exception as e:
            logging.exception(e)

    def attach_tools_to_agent(self):
        try:
            self.build_function_map()
            for i, agent in enumerate(self.agents):
                agent_config: Dict = agent.llm_config
                if agent_config and len(agent_config) > 0:
                    functions: List[Dict] = agent_config.get("functions")
                    if functions and len(functions) > 0:
                        for function in functions:
                            func_name: str = f"{function.get('name')}"
                            module_path = "tools.global_tools"
                            if (
                                not function.get("builtin")
                                and len(function.get("code", "")) > 0
                            ):
                                module_path = f"tools.{self.session_id}"
                            try:
                                # Import the function from the tools directory
                                module = import_module(module_path)
                                func: Callable = getattr(module, func_name)
                                # Register function associated with agent
                                agent.register_function(
                                    function_map={
                                        func_name: func,
                                    }
                                )
                            except ModuleNotFoundError as mnf:
                                logging.exception(mnf)
                                pass
                            # Remove built and code variables it as it is a system variable and does not need to be passed to autogen
                            function.pop("code")
                            function.pop("builtin")
                            self.agents[i] = agent
        except Exception as e:
            logging.exception(e)

    def process_role(self, role):
        agent_type = getattr(autogen, role.get("type"))
        agent_config = role.get("data")
        agent_config["name"] = (
            "admin" if role.get("is_admin") else agent_config.get("name")
        )
        agent_config["socket_client"] = self.socket
        agent_config["sid"] = self.session_id
        agent: Union[autogen.AssistantAgent, autogen.UserProxyAgent] = agent_type(
            **AgentConfig(**agent_config).model_dump()
        )
        if agent.name == "admin":
            self.user_proxy: autogen.UserProxyAgent = agent
        self.agents.append(agent)

    def create_group(self):
        roles = self.group.get("roles")
        for i, role in enumerate(roles):
            self.process_role(role)

    def run_chat(self):
        # single agent, make non-executing UserProxyAgent
        if self.single_agent:
            user_proxy = autogen.UserProxyAgent(
                name=self.agents[0].name,
                use_sockets=True,
                socket_client=self.socket,
                sid=self.session_id,
            )
            return user_proxy.initiate_chat(
                recipient=self.agents[0],
                message=self.prompt,
                use_sockets=True,
                socket_client=self.socket,
                sid=self.session_id,
            )
        # not single agent
        if self.group_chat:
            groupchat = autogen.GroupChat(
                agents=self.agents,
                messages=[],
                max_round=50,
                allow_repeat_speaker=False,
            )
            # Ensuring all members are aware of their team members
            manager = autogen.GroupChatManager(
                groupchat=groupchat,
                llm_config=self.agents[0].llm_config,
                use_sockets=True,
                socket_client=self.socket,
                sid=self.session_id,
            )
            if self.user_proxy:
                self.user_proxy.initiate_chat(
                    recipient=manager,
                    message=self.prompt,
                    clear_history=True,
                    **self.history,
                )
        else:
            recipient = [agent for agent in self.agents if agent.name != "admin"]
            self.user_proxy.initiate_chat(recipient=recipient[0], message=self.prompt)
