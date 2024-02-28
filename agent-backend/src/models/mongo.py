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
    OpenAI = "open_ai"
    Azure = "azure"


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


class Tool(BaseModel):
    model_config = ConfigDict(extra='ignore')
    description: str
    parameters: ToolParameters
    name: str
    code: str
    builtin: bool


class Credentials(BaseModel):
    model_config = ConfigDict(extra='ignore')
    key: Optional[str] = ""
    endpoint: Optional[str]
    type: Optional[Platforms] = Platforms.OpenAI


class Model(BaseModel):
    model_config = ConfigDict(extra='ignore')
    name: str
    model: Optional[ModelType] = ModelType.GPT4
    credentials: Credentials
    embeddingLength: Optional[int] = 384
    seed: Optional[int] = randint(1, 100)
    temperature: Optional[float] = 0
    timeout: Optional[int] = 300
    max_retries: Optional[int] = 10
    stream: Optional[bool] = True


class Data(BaseModel):
    model_config = ConfigDict(extra='ignore')
    task: str = "qa"
    collection_name: str
    chunk_token_size: int = 2000
    embedding_model: str
    model: str
    client: Optional[object] = None


class Task(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    description: str
    expectedOutput: Optional[str] = None
    tools: Optional[Tool] = None
    asyncExecution: Optional[bool] = False
    context: Optional[str] = None
    outputJSON: Optional[BaseModel] = None
    outputPydantic: Optional[BaseModel] = None
    outputFile: Optional[str] = None
    callback: Optional[Callable] = None


class Agent(BaseModel):
    model_config = ConfigDict(extra='ignore')
    """Data model for Autogen Agent Config"""
    # id: Optional[PyObjectId] = Field(alias="_id", default=None)
    role: str
    goal: str
    backstory: str
    llm: Optional[Model] = ModelType.GPT4
    tools: Optional[List[Tool]] = None
    tasks: Optional[List[Task]] = None
    functionCallingLLM: Optional[Model] = ModelType.GPT4
    maxIter: Optional[int] = 10
    maxRPM: Optional[int] = 100
    verbose: Optional[bool] = False
    allowDelegation: Optional[bool] = True
    stepCallback: Optional[Callable] = None


class Crew(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    tasks: Optional[List[Task]] = None
    agents: Optional[List[Agent]] = None
    process: Optional[Process] = Process.Sequential
    managerLLM: Optional[Model] = None
    functionCallingLLM: Optional[Callable] = None
    verbose: Optional[bool] = False
    config: Optional[Dict] = None
    maxRPM: Optional[int] = None
    language: Optional[str] = "en"
    fullOutput: Optional[bool] = False
    stepCallback: Optional[Callable] = None
    shareCrew: Optional[bool] = False


class Session(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    crewId: Crew


class Datasource(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    orgId: Optional[PyObjectId] = Field(default=None)
    teamId: Optional[PyObjectId] = Field(default=None)
    name: str
    sourceId: str
    sourceType: str
    workspaceId: str
    connectionId: str
    destinationId: str
