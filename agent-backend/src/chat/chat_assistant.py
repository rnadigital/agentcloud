import asyncio
import logging
import re

from langchain_core.language_models import BaseLanguageModel
from langchain_core.messages import SystemMessage
from langchain_core.tools import BaseTool
from socketio import SimpleClient
from socketio.exceptions import ConnectionError

from chat.agents.base import BaseChatAgent
from chat.agents.factory import chat_agent_factory
from init.env_variables import SOCKET_URL, AGENT_BACKEND_SOCKET_TOKEN
from init.mongo_session import start_mongo_session
from lang_models import model_factory as language_model_factory
from models.mongo import App, Tool, Datasource, Model, ToolType, Agent
from tools import RagTool, GoogleCloudFunctionTool
from tools.builtin_tools import BuiltinTools


class ChatAssistant:
    chat_model: BaseLanguageModel
    tools: list[BaseTool]
    chat_agent: BaseChatAgent
    system_message: str
    agent_name: str

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.socket = SimpleClient()
        self.mongo_client = start_mongo_session()
        self.init_socket()
        self.init_app_state()
        self.chat_agent = chat_agent_factory(chat_model=self.chat_model, tools=self.tools, agent_name=self.agent_name,
                                             session_id=session_id, socket=self.socket)

    def init_socket(self):
        try:
            # Initialize the socket client and connect
            logging.debug(f"Socket URL: {SOCKET_URL}")
            custom_headers = {"x-agent-backend-socket-token": AGENT_BACKEND_SOCKET_TOKEN}
            self.socket.connect(url=SOCKET_URL, headers=custom_headers)
            self.socket.emit("join_room", f"_{self.session_id}")
        except ConnectionError as ce:
            logging.error(f"Connection error occurred: {ce}")
            raise

    def init_app_state(self):
        session = self.mongo_client.get_session(self.session_id)

        app = self.mongo_client.get_single_model_by_id("apps", App, session.get('appId'))

        app_config = app.chatAppConfig
        if not app_config:
            raise

        agentcloud_agent = self.mongo_client.get_single_model_by_id("agents", Agent, app_config.agentId)
        self.agent_name = agentcloud_agent.name

        agentcloud_tools = self.mongo_client.get_models_by_ids("tools", Tool, agentcloud_agent.toolIds)

        self.system_message = '\n'.join([agentcloud_agent.role, agentcloud_agent.goal, agentcloud_agent.backstory])

        model = self.mongo_client.get_single_model_by_id("models", Model, agentcloud_agent.modelId)
        self.chat_model = language_model_factory(model)

        self.tools = list(map(self._make_langchain_tool, agentcloud_tools))

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
            datasource = self.mongo_client.get_single_model_by_id("datasources", Datasource,
                                                                  agentcloud_tool.datasourceId)
            embedding_model = self.mongo_client.get_single_model_by_id("models", Model, datasource.modelId)
            embedding = language_model_factory(embedding_model)

            return RagTool.factory(tool=agentcloud_tool,
                                   models=[(embedding, embedding_model)],
                                   datasources=[datasource],
                                   llm=self.chat_model)
        elif agentcloud_tool.type == ToolType.HOSTED_FUNCTION_TOOL and not agentcloud_tool.data.builtin:
            tool_class = GoogleCloudFunctionTool
        elif agentcloud_tool.data.builtin:
            tool_class = BuiltinTools.get_tool_class(agentcloud_tool.data.name)

        return tool_class.factory(agentcloud_tool)

    def run(self):
        config = {"configurable": {"thread_id": self.session_id}}
        system_message = SystemMessage(content=self.system_message)
        asyncio.run(self.chat_agent.stream_execute([system_message], config))
