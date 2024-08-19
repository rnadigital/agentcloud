from langchain_anthropic import ChatAnthropic
from langchain_core.language_models import BaseLanguageModel
from langchain_core.tools import BaseTool
from langchain_google_vertexai import ChatVertexAI
from langchain_ollama import ChatOllama
from socketio import SimpleClient

from .anthropic import AnthropicChatAgent
from .ollama import OllamaChatAgent
from .open_ai import OpenAIChatAgent
from .vertex import VertexChatAgent


def chat_agent_factory(chat_model: BaseLanguageModel, tools: list[BaseTool],
                       agent_name: str, session_id: str, socket: SimpleClient):
    if isinstance(chat_model, ChatAnthropic):
        return AnthropicChatAgent(chat_model, tools, agent_name, session_id, socket)
    elif isinstance(chat_model, ChatVertexAI):
        return VertexChatAgent(chat_model, tools, agent_name, session_id, socket)
    elif isinstance(chat_model, ChatOllama):
        return OllamaChatAgent(chat_model, tools, agent_name, session_id, socket)

    # default; works for OpenAI, Azure OpenAI and Groq
    return OpenAIChatAgent(chat_model, tools, agent_name, session_id, socket)
