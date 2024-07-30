from langchain_anthropic import ChatAnthropic
from langchain_core.language_models import BaseLanguageModel
from langchain_core.tools import BaseTool
from langchain_google_vertexai import ChatVertexAI
from langchain_openai import ChatOpenAI
from socketio import SimpleClient

from .anthropic import AnthropicChatAgent
from .open_ai import OpenAIChatAgent
from .vertex import VertexChatAgent


def chat_agent_factory(chat_model: BaseLanguageModel, tools: list[BaseTool],
                       agent_name: str, session_id: str, socket: SimpleClient):
    if isinstance(chat_model, ChatOpenAI):
        return OpenAIChatAgent(chat_model, tools, agent_name, session_id, socket)
    elif isinstance(chat_model, ChatAnthropic):
        return AnthropicChatAgent(chat_model, tools, agent_name, session_id, socket)
    elif isinstance(chat_model, ChatVertexAI):
        return VertexChatAgent(chat_model, tools, agent_name, session_id, socket)
    else:
        raise Exception("Unexpected chat model type")
