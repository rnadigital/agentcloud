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


class TestMongoSession:
    def test_mongo_session(self):
        mongo_client = start_mongo_session()
        connection = mongo_client.connect()
        result = connection.server_info()["ok"] == 1.0
        connection.close()

        assert result
