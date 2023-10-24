import importlib
import logging
import random
import autogen

from utils.log_exception_context_manager import log_exception
from build.template import Org
from init.mongo_session import start_mongo_session
from init.env_variables import SOCKET_URL, BASE_PATH
from socketio.simple_client import SimpleClient
import json

mongo_client = start_mongo_session()

with open(f"{BASE_PATH}/config/base.json", 'r') as f:
    file = json.loads(f.read())


def task_execution(task: str, session_id: str):
    with log_exception():
        socket = SimpleClient()
        socket.connect(url=SOCKET_URL)
        socket.emit("join_room", f"_{session_id}")
        socket.emit(
            "message",
            {"room": session_id,
             "message": f"Executing task: {task}..."})
        # Load team structure from DB
        team = mongo_client.get_team(session_id)
        try:
            # Use team structure to create AutGen team
            org = Org(session_id, team)
            org_saved = org.save_org_structure()
            # Execute task using above team
            if org_saved:
                module_name = f"orgs.{session_id}"
                loaded_module = importlib.import_module(module_name)
                loaded_module.user_proxy.reset()
                loaded_module.user_proxy.initiate_chat(
                    recipient=loaded_module.manager,
                    clear_history=True,
                    message=task,
                    silent=False,
                )
        except ModuleNotFoundError as mnf:
            logging.warning(f"Could not find module: {module_name} in path!")
            logging.exception(mnf)


def init_socket_generate_team(task: str, session_id: str):
    with log_exception():
        socket = SimpleClient()
        socket.connect(url=SOCKET_URL)
        socket.emit("join_room", f"_{session_id}")
        team_task = f"""{task}. 
                Given the above task create the ideal team that will be best suited to complete this task. 
                Return the team in the below structure {json.dumps(file, indent=2)}. 
                There are no hard limits on the number or the combination of team members."""
        socket.emit(
            "message",
            {"room": session_id,
             "message": f"Received task: {task}. Formulating team that will undertake this task..."})

        config_list = autogen.config_list_from_json(
            "./src/config/OAI_CONFIG_LIST.json",
            filter_dict={
                "model": {
                    "gpt-4",
                }
            }
        )

        gpt4_config = {
            "seed": random.random(),
            "temperature": 0,
            "request_timeout": 120,
            "retry_wait_time": 100,
            "config_list": config_list,
        }

        user_proxy = autogen.UserProxyAgent(
            name="Admin",
            llm_config=gpt4_config,
            system_message="A human admin. Interact with the planner and team designer designer to discuss the plan. Plan execution needs to be approved by this admin.",
            human_input_mode="ALWAYS",
            code_execution_config=False,
            use_sockets=True,
            socket_client=socket,
            sid=session_id
        )

        team_designer = autogen.AssistantAgent(
            name="Team-Designer",
            llm_config=gpt4_config,
            system_message="Team Designer. You are an expert team designer. you will design highly efficent team comprised of the ideal team members that can execute the plan to perfection. You must account for any authentication and API communication required to complete the task",
            human_input_mode="",
            code_execution_config=False,
            use_sockets=True,
            socket_client=socket,
            sid=session_id
        )

        user_proxy.initiate_chat(
            team_designer,
            clear_history=True,
            message=team_task
        )
