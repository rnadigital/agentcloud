from openai._exceptions import APIError
import logging
import random
import autogen
from utils.log_exception_context_manager import log_exception
from init.mongo_session import start_mongo_session
from init.env_variables import SOCKET_URL, BASE_PATH, AGENT_BACKEND_SOCKET_TOKEN
from socketio.simple_client import SimpleClient
from socketio.exceptions import DisconnectedError
import json
from build.build_group import ChatBuilder
from messaging.send_message_to_socket import send
import requests
from models.canopy_server import ChatRequest

mongo_client = start_mongo_session()


def task_execution(task: str, session_id: str):
    try:
        try:
            # Load team structure from DB
            session = mongo_client.get_session(session_id)
            group = mongo_client.get_group(session)
            single_agent = session.get('agentId') is not None
            build_chat = ChatBuilder(task, session_id, group, single_agent, {})
            build_chat.create_group()
            build_chat.attach_tools_to_agent()
            build_chat.run_chat()
        except Exception as e:
            logging.exception(e)
    except DisconnectedError as de:
        logging.warning("The socket connection was disconnected")
        logging.exception(de)
    except Exception as e:
        logging.exception(e)


def rag_execution(
        message: str,
        session_id: str,
        model: str = "gpt-4",
        stream: bool = True
):
    try:
        # session = mongo_client.get_session(session_id)
        socket = SimpleClient()
        custom_headers = {
            'x-agent-backend-socket-token': AGENT_BACKEND_SOCKET_TOKEN
        }
        socket.connect(url=SOCKET_URL, headers=custom_headers)
        socket.emit("join_room", f"_{session_id}")
        history = mongo_client.get_chat_history(session_id)
        output = ""
        history += [{"role": "user", "content": message}]

        first = True
        request = ChatRequest(
            model=model,
            messages=history,
            stream=stream
        )
        try:
            if stream:
                openai_response = requests.post("http://127.0.0.1:8000/v1/chat/completions",
                                                request.model_dump_json(), stream=True).iter_lines(decode_unicode=True)
                for chunk in openai_response:
                    if chunk.startswith("data: "):
                        chunk = chunk.strip("data: ")
                        chunk = json.loads(chunk)
                        text = chunk.get("choices")[0].get("delta").get("content") or ""
                    else:
                        text = chunk
                    output += text
                    send(socket, session_id, "message", "Rag", text, first=first)
                    first = False
            else:
                openai_response = requests.post("http://127.0.0.1:8000/v1/chat/completions",
                                                request.model_dump_json()).json()
                output = openai_response.get("choices")[0].get("message").get("content") or ""
                send(socket, session_id, "message", "Rag", output, first=first)
        except (Exception,) as e:
            err = e.body if isinstance(e, APIError) else str(e)
            msg = f"Oops... something went wrong. The error I got is: {err}"
            raise Exception(msg)
        send(socket, session_id, "message_complete", "Rag", output, first=first, single=True)
        return True
        # return output
    except Exception as e:
        logging.exception(e)
        raise e


def init_socket_generate_group(task: str, session_id: str):
    with log_exception():
        socket = SimpleClient()
        custom_headers = {
            'x-agent-backend-socket-token': AGENT_BACKEND_SOCKET_TOKEN
        }
        socket.connect(url=SOCKET_URL, headers=custom_headers)
        socket.emit("join_room", f"_{session_id}")

        with open(f"{BASE_PATH}/config/base.json", 'r') as f:
            group_generation = json.loads(f.read())

        team_task = [f"""Given the following task, create the ideal team that will be best suited to complete the task:

"{task}"

Return the team in the below JSON structure:""", json.dumps(group_generation, indent=2),
                     "There are no hard limits on the number or the combination of team members."]

        config_list = autogen.config_list_from_json(
            f"{BASE_PATH}/config/OAI_CONFIG_LIST.json",
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
            system_message="A human admin. Interact with the planner and/or team designer designer to discuss the plan. Plan execution needs to be approved by this admin.",
            human_input_mode="ALWAYS",
            code_execution_config=False,
            use_sockets=True,
            socket_client=socket,
            sid=session_id
        )

        team_designer = autogen.AssistantAgent(
            name="Team-Designer",
            llm_config=gpt4_config,
            system_message="Team Designer. You are an expert team designer. you will design highly efficient team comprised of the ideal team members that can execute the plan to perfection. You must account for any authentication and API communication required to complete the task. Return the team in the JSON structure given to you",
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


if __name__ == "__main__":
    rag_execution("gpt-4", [], "can you add up all the spend on R&D Expense")
