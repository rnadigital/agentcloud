from dataclasses import field
from typing import Any, Dict, List, Optional, Union, Callable
from random import randint
from pydantic import BaseModel, ConfigDict
from enum import Enum


class ToolType(str, Enum):
    API_TOOL = 'api'
    HOSTED_FUNCTION_TOOL = 'function'


class FunctionProperty(BaseModel):
    type: Union[str, int, float, bool, None]
    description: str


class ToolParameters(BaseModel):
    type: str
    properties: Dict[str, FunctionProperty]
    required: List[str]


class ToolData(BaseModel):
    description: str
    parameters: ToolParameters
    name: str


# class Tool(BaseModel):
#     name: str
#     functionName: str = 'function_name'
#     type: ToolType
#     data: Optional[ToolData] = None


class Platforms(str, Enum):
    OpenAI = 'open_ai'
    Azure = 'azure'


class Models(str, Enum):
    GPT4 = "gpt-4"
    GPT4TURBO = "gpt-4-1106-preview"
    GPT3TURBO = "gpt-3.5-turbo"


class ConfigList(BaseModel):
    """Data model for OpenAi Model Config"""
    api_key: Optional[str] = ""
    api_type: Optional[Platforms] = Platforms.OpenAI
    model: Optional[Models] = Models.GPT4
    timeout: int = 300
    max_retries: int = 10


class LLMConfig(BaseModel):
    """Data model for Autogen  LLMConfig"""
    seed: int = randint(1, 100)
    config_list: List[ConfigList] = field(default_factory=list)
    temperature: float = 0
    timeout: int = 300
    max_retries: int = 10
    stream: bool = True
    functions: Optional[List[ToolData]] = None


class AgentConfig(BaseModel):
    """Data model for Autogen Agent Config"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    name: str
    llm_config: LLMConfig
    human_input_mode: Optional[str] = "NEVER"
    system_message: Optional[str] = ""
    max_consecutive_auto_reply: Optional[int] = 10
    is_termination_msg: Union[Callable, str] = lambda x: x.get("content", "") and x.get("content",
                                                                                        "").rstrip().endswith(
        "TERMINATE")
    code_execution_config: Optional[Union[bool, str, Dict[str, Any]]] = {}
    use_sockets: Optional[bool] = True
    socket_client: Any = None
    sid: str = None


class AgentTypes(str, Enum):
    AssistantAgent = "AssistantAgent"
    UserProxyAgent = "UserProxyAgent"
    RetrieverUserProxyAgent = "RetrieverUserProxyAgent"
    RetrieverAssistantProxyAgent = "RetrieverAssistantProxyAgent"
    TeachableAgent = "TeachableAgent"


class AgentData(BaseModel):
    data: AgentConfig
    type: str
    is_admin: Optional[bool] = False
