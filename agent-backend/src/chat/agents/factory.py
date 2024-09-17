from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_vertexai import ChatVertexAI
from langchain_ollama import ChatOllama
from typing import TYPE_CHECKING

from .anthropic import AnthropicChatAgent
from .ollama import OllamaChatAgent
from .open_ai import OpenAIChatAgent
from .vertex import VertexChatAgent

if TYPE_CHECKING:
    from ..chat_assistant import ChatAssistant


def chat_agent_factory(chat_assistant_obj: 'ChatAssistant'):
    chat_model = chat_assistant_obj.chat_model
    
    if isinstance(chat_model, ChatAnthropic):
        return AnthropicChatAgent(chat_assistant_obj)
    elif isinstance(chat_model, ChatVertexAI) or isinstance(chat_model, ChatGoogleGenerativeAI):
        return VertexChatAgent(chat_assistant_obj)
    elif isinstance(chat_model, ChatOllama):
        return OllamaChatAgent(chat_assistant_obj)

    # default; works for OpenAI, Azure OpenAI and Groq
    return OpenAIChatAgent(chat_assistant_obj)
