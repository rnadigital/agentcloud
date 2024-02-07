import autogen
from autogen.agentchat.contrib.qdrant_retrieve_user_proxy_agent import (
    QdrantRetrieveUserProxyAgent,
)
from autogen.agentchat.contrib.retrieve_assistant_agent import RetrieveAssistantAgent
from autogen.agentchat.contrib.llava_agent import LLaVAAgent
from autogen.agentchat.contrib.web_surfer import WebSurferAgent

from typing import NamedTuple

from dataclasses import dataclass

@dataclass(frozen=True)
class AvailableAgents(NamedTuple):
    AssistantAgent = autogen.AssistantAgent
    ConversableAgent = autogen.ConversableAgent
    UserProxyAgent = autogen.UserProxyAgent
    GroupChatManager = autogen.GroupChatManager
    GroupChatManager = autogen.GroupChatManager
    RetrieveAssistantAgent = RetrieveAssistantAgent
    QdrantRetrieveUserProxyAgent = QdrantRetrieveUserProxyAgent
    LLaVAAgent = LLaVAAgent
    WebSurferAgent = WebSurferAgent