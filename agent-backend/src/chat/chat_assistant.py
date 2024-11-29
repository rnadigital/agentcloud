import asyncio
import logging
import re
from datetime import datetime

from langchain_core.language_models import BaseLanguageModel
from langchain_core.tools import BaseTool
from socketio import SimpleClient
from socketio.exceptions import ConnectionError

from chat.agents.base import BaseChatAgent
from chat.agents.factory import chat_agent_factory
from init.env_variables import SOCKET_URL, AGENT_BACKEND_SOCKET_TOKEN, MONGO_DB_NAME
from init.mongo_session import start_mongo_session
from lang_models import model_factory as language_model_factory
from models.mongo import App, Tool, Datasource, Model, ToolType, Agent, VectorDb
from tools import RagTool, GoogleCloudFunctionTool
from tools.builtin_tools import BuiltinTools
from messaging.send_message_to_socket import send
from models.sockets import SocketMessage, SocketEvents, Message

logger = logging.getLogger(__name__)


class ChatAssistant:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.socket = SimpleClient()
        self.mongo_conn = start_mongo_session()
        self.chat_model: BaseLanguageModel
        self.tools: list[BaseTool] = []
        self.system_message: str
        self.agent_name: str
        self.max_messages: int
        self.init_socket()
        self.init_app_state()
        self.chat_agent = chat_agent_factory(chat_assistant_obj=self)

    def init_socket(self):
        try:
            # Initialize the socket client and connect
            logger.debug(f"Socket URL: {SOCKET_URL}")
            custom_headers = {"x-agent-backend-socket-token": AGENT_BACKEND_SOCKET_TOKEN}
            self.socket.connect(url=SOCKET_URL, headers=custom_headers)
            self.socket.emit("join_room", f"_{self.session_id}")
        except ConnectionError as ce:
            logger.error(f"Connection error occurred: {ce}")
            raise

    def init_app_state(self):
        session = self.mongo_conn.get_session(self.session_id)

        app = self.mongo_conn.get_single_model_by_id("apps", App, session.appId)

        app_config = app.chatAppConfig
        if not app_config:
            raise

        agentcloud_agent = self.mongo_conn.get_single_model_by_id("agents", Agent, app_config.agentId)
        self.agent_name = agentcloud_agent.name

        agentcloud_tools = self.mongo_conn.get_models_by_ids("tools", Tool, agentcloud_agent.toolIds)

        self.system_message = '\n'.join([agentcloud_agent.role, agentcloud_agent.goal, agentcloud_agent.backstory])

        if session.variables:
            self.system_message = self.system_message.format(**session.variables)

        model = self.mongo_conn.get_single_model_by_id("models", Model, agentcloud_agent.modelId)
        try:
            self.chat_model = language_model_factory(model)
            self.tools = list(map(self._make_langchain_tool, agentcloud_tools))
        except Exception as ce:
            print(ce)
            import traceback
            print(traceback.format_exc())
            # TODO: a shared function/static class method for send_to_sockets
            send(
                self.socket,
                SocketEvents("message"),
                SocketMessage(
                    room=self.session_id,
                    authorName="System",
                    message=Message(
                        chunkId=None,
                        text="An error occurred during tool instantiation",
                        first=True,
                        tokens=1,
                        timestamp=int(datetime.now().timestamp() * 1000),
                        displayType="bubble",
                        overwrite=False,
                    )
                ),
                "both"
            )

        self.max_messages = app_config.maxMessages

    @staticmethod
    def _transform_tool_name(tool_name: str) -> str:
        """
        Remove all non-alphanumeric characters from tool name except spaces, hyphens and underscores,
        and re-join them else llm will complain (allowed chars: [a-zA-Z0-9_-])
        """
        return '_'.join(re.sub(r'[^a-zA-Z0-9 _-]', '', tool_name).split())

    def _make_langchain_tool(self, agentcloud_tool: Tool):
        tool_class = None

        agentcloud_tool.name = self._transform_tool_name(agentcloud_tool.name)

        if agentcloud_tool.type == ToolType.RAG_TOOL:
            datasource = self.mongo_conn.get_single_model_by_id("datasources", Datasource,
                                                                  agentcloud_tool.datasourceId)
            embedding_model = self.mongo_conn.get_single_model_by_id("models", Model, datasource.modelId)
            embedding = language_model_factory(embedding_model)

            if datasource.byoVectorDb:
                if not datasource.vectorDbId:
                    raise ValueError(f"Vector database ID not found for datasource {datasource.id}")
                vector_db = self.mongo_conn.get_single_model_by_id("vectordbs", VectorDb, datasource.vectorDbId)
                if not vector_db:
                    raise ValueError(f"Vector database not found for ID {datasource.vectorDbId}")
                datasource.vector_db = vector_db

            return RagTool.factory(tool=agentcloud_tool,
                                   models=[(embedding, embedding_model)],
                                   datasources=[datasource],
                                   llm=self.chat_model)
        elif agentcloud_tool.type == ToolType.HOSTED_FUNCTION_TOOL:
            tool_class = GoogleCloudFunctionTool
        elif agentcloud_tool.type == ToolType.BUILTIN_TOOL:
            tool_name = agentcloud_tool.data.name
            if agentcloud_tool.linkedToolId:
                linked_tool = self.mongo_conn.get_tool(agentcloud_tool.linkedToolId)
                if linked_tool:
                    tool_class = BuiltinTools.get_tool_class(linked_tool.data.name)
                else:
                    logging.warning(
                        f"linked tool ID {agentcloud_tool.linkedToolId} not found for installed tool {agentcloud_tool.id}")
            else:
                tool_class = BuiltinTools.get_tool_class(tool_name)

        return tool_class.factory(agentcloud_tool)

    def run(self):
        asyncio.run(self.chat_agent.stream_execute())
