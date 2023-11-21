from dataclasses import field
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel
from random import randint


class ConfigList(BaseModel):
    """Data model for OpenAi Model Config"""
    api_key: Optional[str] = ""
    api_type: Optional[str] = "open_ai"
    model: Optional[str] = "gpt-4"
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
    # tools: Optional[list] = list()


class AgentConfig(BaseModel):
    """Data model for Autogen Agent Config"""
    name: str
    llm_config: LLMConfig
    human_input_mode: str = "NEVER"
    system_message: str = ""
    max_consecutive_auto_reply: int = 10
    is_termination_msg: Union[bool, str] = None
    code_execution_config: Optional[Union[bool, str, Dict[str, Any]]] = None
    use_sockets: bool = True
    socket_client: Any = None
    sid: str = None
