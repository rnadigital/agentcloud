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


class ApiCredentials(BaseModel):
    api_key: Optional[str] = Field(alias="key")
    base_url: Optional[str] = Field(alias="endpointURL")


class Credentials(BaseModel):
    model_config = ConfigDict(extra='ignore')
    type: Optional[Platforms] = Field(default=Platforms.ChatOpenAI)
    credentials: Optional[ApiCredentials] = None


class Model(BaseModel):
    model_config = ConfigDict(extra='ignore')
    name: str
    model_name: Optional[ModelType] = Field(default=ModelType.GPT4, alias="model")
    credentials: Optional[PyObjectId] = None
    embeddingLength: Optional[int] = 384
    seed: Optional[int] = randint(1, 100)
    temperature: Optional[float] = 0
    timeout: Optional[int] = 300
    max_retries: Optional[int] = 10
    stream: Optional[bool] = True


class ChatModel(BaseModel):
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
    model_config = ConfigDict(extra='ignore')
    task: str = "qa"
    collection_name: str
    chunk_token_size: int = 2000
    embedding_model: str
    model: str
    client: Optional[object] = None


class Task(BaseModel):
    model_config = ConfigDict(extra='ignore')
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

#
# [{'_id': ObjectId('65dbcda365dbd3ac36434a51'), 'orgId': ObjectId('65d56d322f9651271cc671d3'), 'teamId': ObjectId('65d56d322f9651271cc671d4'), 'name': 'OpenAI', 'credentialId': ObjectId('65dbcd9865dbd3ac36434a50'), 'model': 'gpt-3.5-turbo', 'embeddingLength': 0, 'modelType': 'llm'}]
# [{'_id': ObjectId('65dbcd9865dbd3ac36434a50'), 'orgId': ObjectId('65d56d322f9651271cc671d3'), 'teamId': ObjectId('65d56d322f9651271cc671d4'), 'name': 'oai_creds', 'createdDate': datetime.datetime(2024, 2, 25, 23, 30, 32, 706000), 'type': 'open_ai', 'credentials': {'key': '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', 'endpointURL': None}}]
