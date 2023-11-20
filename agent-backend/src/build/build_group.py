from socketio.simple_client import SimpleClient
from init.env_variables import SOCKET_URL
import autogen
from random import randint
from typing import Optional


def create_run_chat(session_id: str, roles: list, group_chat: bool, prompt: str, history: Optional[dict]):
    # Initialize the socket client and connect
    socket = SimpleClient()
    socket.connect(url=SOCKET_URL)
    socket.emit("join_room", f"_{session_id}")
    # Create configurations for each role
    configs = []
    for role in roles:
        config = {
            "seed": randint(1, 1000),
            "temperature": 0,
            "request_timeout": 300,
            "retry_wait_time": 60,
            "stream": True,
            "config_list": [{
                "api_key": role.get("key"),
                "api_type": role.get("platform"),
                "model": role.get("model")
            }]
        }
        if role.get("is_admin"):
            admin_config = config
        else:
            configs.append(config)

    # Initialize agents
    agents = []
    for i, role in enumerate(roles):
        agent_type = getattr(autogen, role.get("type"))
        if role.get("is_admin"):
            user_proxy = agent_type(
                name="admin",
                llm_config=admin_config,
                system_message=role.get("system_message"),
                human_input_mode=role.get("human_input_mode") or "ALWAYS",
                code_execution_config=role.get('code_execution_config', False),
                use_sockets=True,
                socket_client=socket,
                sid=session_id
            )
        else:
            agent = agent_type(
                name=role.get("name"),  # Assuming format_role_name is a function to format the name
                llm_config=configs[i],
                system_message=role.get("system_message"),
                human_input_mode=role.get("human_input_mode") or "NEVER",
                code_execution_config=role.get('code_execution_config', False),
                use_sockets=True,
                socket_client=socket,
                sid=session_id
            )
            agents.append(agent)

    # Initialize group chat if required
    if group_chat:
        groupchat = autogen.GroupChat(agents=[user_proxy] + agents, messages=[], max_round=50)
        manager = autogen.GroupChatManager(groupchat=groupchat, llm_config=configs[0], use_sockets=True,
                                           socket_client=socket, sid=session_id)
        if admin_config:
            user_proxy.initiate_chat(recipient=manager, message=prompt, clear_history=True)
