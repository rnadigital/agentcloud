from dataclasses import field
from typing import Any, Dict, List, Optional, Union, Callable
from random import randint
from pydantic import BaseModel, BeforeValidator, Field
from enum import Enum
from typing import Annotated

# Represents an ObjectId field in the database.
# It will be represented as a `str` on the model so that it can be serialized to JSON.
PyObjectId = Annotated[str, BeforeValidator(str)]


class ToolType(str, Enum):
    API_TOOL = "api"
    HOSTED_FUNCTION_TOOL = "function"


class FunctionProperty(BaseModel):
    type: Union[str, int, float, bool, None]
    description: str


class ToolParameters(BaseModel):
    type: str
    properties: Dict[str, FunctionProperty]
    required: List[str]


class Tool(BaseModel):
    description: str
    parameters: ToolParameters
    name: str
    code: str
    builtin: bool


class DatasourceData(BaseModel):
    id: str
    model: str


class Platforms(str, Enum):
    OpenAI = "open_ai"
    Azure = "azure"


class ModelType(str, Enum):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    GPT4 = "gpt-4"
    GPT4TURBO = "gpt-4-1106-preview"
    GPT3TURBO = "gpt-3.5-turbo"


class Models(BaseModel):
    """Data model for Autogen  LLMConfig"""

    seed: Optional[int] = randint(1, 100)
    api_key: Optional[str] = ""
    api_type: Optional[Platforms] = Platforms.OpenAI
    model: Optional[ModelType] = ModelType.GPT4
    temperature: Optional[float] = 0
    timeout: Optional[int] = 300
    max_retries: Optional[int] = 10
    stream: Optional[bool] = True


class Data(BaseModel):
    task: str = "qa"
    collection_name: str
    chunk_token_size: int = 2000
    embedding_model: str
    model: str
    client: Optional[object] = None


class Agent(BaseModel):
    """Data model for Autogen Agent Config"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    Role: str
    Goal: str
    Backstory: str
    LLM: Optional[Models] = Models.GPT4
    Tools: Optional[List[Tool]]
    functionCallingLLM: Optional[Models] = Models.GPT4
    maxIter: Optional[int]
    maxRpm: Optional[int]
    verbose: Optional[bool]
    allowDelegation: Optional[bool]
    stepCallback: Optional[Callable]


class Task(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    description: str
    expectedOutput: Optional[str]
    Tools: Optional[Tool]
    asyncExecution: Optional[bool]
    context: Optional[str]
    outputJSON: Optional[BaseModel]
    outputPydantic: Optional[BaseModel]
    outputFile: Optional[str]
    callback: Optional[Callable]


class Datasource(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    orgId: Optional[PyObjectId] = Field(default=None)
    teamId: Optional[PyObjectId] = Field(default=None)
    name: str
    sourceId: str
    sourceType: str
    workspaceId: str
    connectionId: str
    destinationId: str
