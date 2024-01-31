import autogen
from autogen.agentchat.contrib.qdrant_retrieve_user_proxy_agent import (
    QdrantRetrieveUserProxyAgent,
)
from autogen.agentchat.contrib.retrieve_assistant_agent import RetrieveAssistantAgent
from autogen.agentchat import UserProxyAgent

# Accepted file formats for that can be stored in
# a vector database instance
from autogen.retrieve_utils import TEXT_FORMATS
import qdrantClient.qdrant_connection as qdc


from datetime import datetime
from pprint import pprint

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
from uuid import uuid4
from autogen.token_count_utils import count_token
from models.sockets import SocketMessage, SocketEvents, Message
import messaging.send_message_to_socket as sms
import logging


if __name__ == "__main__":
    
    # session_id 12-byte input or a 24-character hex string
    session_id = "60a6d3c0e4b0c1a6e1b4a8f5"
    room = "dev_room"
    model = "gpt-4"
    stream = True

    logging.basicConfig(level=logging.INFO)
    print(f"Current log level: {logging.getLogger().getEffectiveLevel()}")

    socket = SimpleClient()
    custom_headers = {"x-agent-backend-socket-token": AGENT_BACKEND_SOCKET_TOKEN}

    # socket.connect(url=SOCKET_URL, headers=custom_headers)
    # socket.emit("join_room", f"_{session_id}")
    socket_message = SocketMessage(
        room=room, authorName="system", message=Message(text=f"_{session_id}")
    )
    sms.send(
        client=socket,
        event="join_room",
        message=socket_message,
        socket_logging="logging",
    )

    
    total_tokens = 0
    agent_name = "Retriever"

    config_list = autogen.config_list_from_json(
        # env_or_file="/home/joshuak/Github/rnadigital/agentcloud/agent-backend/src/OAI_CONFIG_LIST",
        env_or_file="./OAI_CONFIG_LIST",
        filter_dict={
            "model": {
                model,
            }
        },
    )
    
    assert len(config_list) > 0

    llm_config = {"config_list": config_list, "cache_seed": 42}

    print("models to use: ", [config_list[i]["model"] for i in range(len(config_list))])

    # 1. create an RetrieveAssistantAgent instance named "assistant"
    assistant = RetrieveAssistantAgent(
        name="assistant",
        system_message="""
                    You have two other assistants helping you. 
                    Synthesize their answer and contrast the difference between Obama and Trump.
                    Once synthesized, end your response with (note the new line)
                    TERMINATE.""",
        llm_config={
            "timeout": 600,
            "cache_seed": 42,
            "config_list": config_list,
        },
    )

    # 2. create the QdrantRetrieveUserProxyAgent instance named "ragproxyagent"
    # By default, the human_input_mode is "ALWAYS", which means the agent will ask for human input at every step. We set it to "NEVER" here.
    # `docs_path` is the path to the docs directory. It can also be the path to a single file, or the url to a single file. By default,
    # it is set to None, which works only if the collection is already created.
    #
    # Here we generated the documentations from FLAML's docstrings. Not needed if you just want to try this notebook but not to reproduce the
    # outputs. Clone the FLAML (https://github.com/microsoft/FLAML) repo and navigate to its website folder. Pip install and run `pydoc-markdown`
    # and it will generate folder `reference` under `website/docs`.
    #
    # `task` indicates the kind of task we're working on. In this example, it's a `code` task.
    # `chunk_token_size` is the chunk token size for the retrieve chat. By default, it is set to `max_tokens * 0.6`, here we set it to 2000.
    # We use an in-memory QdrantClient instance here. Not recommended for production.
    # Get the installation instructions here: https://qdrant.tech/documentation/guides/installation/
    ragproxyagent_obama = QdrantRetrieveUserProxyAgent(
        name="ragproxyagent",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=10,
        retrieve_config={
            "task": "code",
            "collection_name": "devcollection_barack_obama",
            "docs_path": "https://en.wikipedia.org/wiki/Barack_Obama",
            "chunk_token_size": 2000,
            "model": config_list[0]["model"],
            "client": qdc.get_connection(host="localhost", port=6333),
            "embedding_model": "BAAI/bge-small-en-v1.5",
        },
    )

    ragproxyagent_donald = QdrantRetrieveUserProxyAgent(
        name="ragproxyagent",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=10,
        retrieve_config={
            "task": "code",
            "collection_name": "devcollection_donald_trump",
            "docs_path": "https://en.wikipedia.org/wiki/Donald_Trump",
            "chunk_token_size": 2000,
            "model": config_list[0]["model"],
            "client": qdc.get_connection(host="localhost", port=6333),
            "embedding_model": "BAAI/bge-small-en-v1.5",
        },
    )

    # if human_input_mode is set to NEVER, the only use of this agent is to kickoff the group chat
    # if human_input_mode is set to ALWAYS, the human will be able to answer questions, provide feedback, etc.
    dummy_user_proxy = UserProxyAgent(
        name="dummy_user_proxy",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=10,
        llm_config={
            "timeout": 600,
            "cache_seed": 42,
            "config_list": config_list,
        },
        is_termination_msg=lambda msg: "TERMINATE" in msg["content"]
    )

    # reset the assistant. Always reset the assistant before starting a new conversation.
    assistant.reset()

    groupchat = autogen.GroupChat(agents=[assistant, ragproxyagent_obama, ragproxyagent_donald, dummy_user_proxy], messages=[], max_round=6)
    manager = autogen.GroupChatManager(groupchat=groupchat, llm_config=llm_config)

    qa_problem = "What are the main contributions of Barack Obama and Donald Trump during their presidency?"
    
    # Kick off the groupd chat
    dummy_user_proxy.initiate_chat(manager, message=qa_problem)