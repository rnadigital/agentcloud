from langchain_anthropic import ChatAnthropic
from langchain_core.language_models import BaseLanguageModel
from langchain_core.tools import BaseTool
from socketio import SimpleClient

from .anthropic import AnthropicChatAgent
from .default import DefaultChatAgent


def chat_agent_factory(chat_model: BaseLanguageModel, tools: list[BaseTool],
                       agent_name: str, session_id: str, socket: SimpleClient):
    if isinstance(chat_model, ChatAnthropic):
        return AnthropicChatAgent(chat_model, tools, agent_name, session_id, socket)

    return DefaultChatAgent(chat_model, tools, agent_name, session_id, socket)
