from langchain_core.tools import BaseTool
from socketio import SimpleClient


class HumanInputTool(BaseTool):
    name = "human_input"
    description = "Accepts messages from the user"
    socket_client: SimpleClient = None

    def __init__(self, socket_client: SimpleClient, **kwargs):
        super().__init__(**kwargs)
        self.socket_client = socket_client

    def _run(self):
        feedback = self.socket_client.receive()
        return feedback[1]

