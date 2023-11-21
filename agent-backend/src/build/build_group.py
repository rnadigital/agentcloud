from socketio.simple_client import SimpleClient
from init.env_variables import SOCKET_URL
import autogen
from typing import Optional
from models.config_models import LLMConfig, AgentConfig, ConfigList


def create_run_chat(session_id: str, roles: list, group_chat: bool, prompt: str, history: Optional[dict],
                    **function_config):
    # Initialize the socket client and connect
    socket = SimpleClient()
    socket.connect(url=SOCKET_URL)
    socket.emit("join_room", f"_{session_id}")

    # Create configurations for each role
    configs = []
    for role in roles:
        config: LLMConfig = LLMConfig(
            config_list=[ConfigList(
                api_key=role.get("key"),
                api_type=role.get("platform"),
                model=role.get("model")
            ).model_dump()],
            stream=True,
        )
        configs.append(config.model_dump(exclude_unset=True))

    # Initialize agents
    agents = []
    for i, role in enumerate(roles):
        agent_type = getattr(autogen, role.get("type"))
        _agent: AgentConfig = AgentConfig(
            name="admin" if role.get("is_admin") else role.get("name"),
            llm_config=configs[i],
            system_message=role.get("system_message"),
            human_input_mode=role.get("human_input_mode") or "NEVER",
            code_execution_config=role.get('code_execution_config', False),
            socket_client=socket,
            sid=session_id,
        )
        agent = agent_type(**_agent.model_dump())
        if agent.name == 'admin':
            user_proxy = agent
            agents.append(user_proxy)
        else:
            agents.append(agent)

    # Initialize group chat if required
    if group_chat:
        groupchat = autogen.GroupChat(agents=agents, messages=[], max_round=50)
        manager = autogen.GroupChatManager(groupchat=groupchat, llm_config=configs[0], use_sockets=True,
                                           socket_client=socket, sid=session_id)
        if user_proxy:
            user_proxy.initiate_chat(recipient=manager, message=prompt, clear_history=True, **history)
