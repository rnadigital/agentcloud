from typing import Dict, List, Optional, Union, Callable
from random import randint
from pydantic import BaseModel, BeforeValidator, Field, ConfigDict
from enum import Enum
from typing import Annotated

# Represents an ObjectId field in the database.
# It will be represented as a `str` on the model so that it can be serialized to JSON.
PyObjectId = Annotated[str, BeforeValidator(str)]

# Enums
class Process(str, Enum):
    Sequential = "sequential"
    Hierarchical = "hierarchical"
    Consensual = "consensual"


class ToolType(str, Enum):
    API_TOOL = "api"
    HOSTED_FUNCTION_TOOL = "function"


class Platforms(str, Enum):
    ChatOpenAI = "open_ai"
    AzureChatOpenAI = "azure"
    FastEmbed = "fastembed"


class ModelType(str, Enum):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    GPT4 = "gpt-4"
    GPT4TURBO = "gpt-4-1106-preview"
    GPT3TURBO = "gpt-3.5-turbo"


# Models
class FunctionProperty(BaseModel):
    model_config = ConfigDict(extra='ignore')
    type: Union[str, int, float, bool, None]
    description: str


class ToolParameters(BaseModel):
    model_config = ConfigDict(extra='ignore')
    type: str
    properties: Dict[str, FunctionProperty]
    required: List[str]


class ToolData(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    parameters: Optional[ToolParameters] = None
    builtin: bool


class Tool(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    name: str
    description: Optional[str] = None
    type: Optional[str] = "function"
    datasourceId: Optional[PyObjectId] = None
    data: Optional[ToolData] = None


class ApiCredentials(BaseModel):
    api_key: Optional[str] = Field(alias="key")
    base_url: Optional[str] = Field(alias="endpointURL")


class Credentials(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    type: Optional[Platforms] = Field(default=Platforms.ChatOpenAI)
    credentials: Optional[ApiCredentials] = None


class Model(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    name: str
    model_name: Optional[ModelType] = Field(default=ModelType.GPT4, alias="model")
    credentialId: Optional[PyObjectId] = None
    credentials: Optional[PyObjectId] = None
    embeddingLength: Optional[int] = 384
    seed: Optional[int] = randint(1, 100)
    temperature: Optional[float] = 0
    timeout: Optional[int] = 300
    max_retries: Optional[int] = 10
    stream: Optional[bool] = True


class ChatModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    api_key: Optional[str] = None
    model_name: Optional[ModelType] = Field(default=ModelType.GPT4, alias="model")
    seed: Optional[int] = randint(1, 100)
    temperature: Optional[float] = 0
    timeout: Optional[int] = 300
    max_retries: Optional[int] = 10
    stream: Optional[bool] = True
    base_url: Optional[str] = None
    max_tokens: Optional[int] = None


class Data(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    task: str = "qa"
    collection_name: str
    chunk_token_size: int = 2000
    embedding_model: str
    model: str
    client: Optional[object] = None


class Task(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    description: str
    expectedOutput: Optional[str] = None
    agentId: PyObjectId = None
    toolIds: Optional[List[PyObjectId]] = None
    tools: Optional[Tool] = None
    asyncExecution: Optional[bool] = False
    context: Optional[str] = None
    outputJSON: Optional[BaseModel] = None
    outputPydantic: Optional[BaseModel] = None
    outputFile: Optional[str] = None
    callback: Optional[Callable] = None


class Agent(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    """Data model for Autogen Agent Config"""
    role: str
    goal: str
    backstory: str
    llm: Optional[Model] = ModelType.GPT4
    toolIds: Optional[List[PyObjectId]] = None
    taskIds: Optional[List[PyObjectId]] = None
    modelId: PyObjectId
    tools: Optional[List[Tool]] = None
    tasks: Optional[List[Task]] = None
    functionCallingLLM: Optional[Model] = ModelType.GPT4
    maxIter: Optional[int] = 10
    maxRPM: Optional[int] = 100
    verbose: Optional[bool] = False
    allowDelegation: Optional[bool] = True
    stepCallback: Optional[Callable] = None


class Crew(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    tasks: Optional[List[PyObjectId]] = None
    agents: Optional[List[PyObjectId]] = None
    process: Optional[Process] = Process.Sequential
    managerLLM: Optional[Model] = None
    functionCallingLLM: Optional[Callable] = None
    verbose: Optional[bool] = False
    config: Optional[Dict] = {}
    maxRPM: Optional[int] = None
    language: Optional[str] = "en"
    fullOutput: Optional[bool] = False
    stepCallback: Optional[Callable] = None
    shareCrew: Optional[bool] = False


class Session(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    crewId: Crew


class Datasource(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    orgId: Optional[PyObjectId] = Field(default=None)
    teamId: Optional[PyObjectId] = Field(default=None)
    name: str
    sourceId: PyObjectId
    sourceType: str
    workspaceId: PyObjectId
    connectionId: PyObjectId
    destinationId: PyObjectId
