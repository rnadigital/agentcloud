from typing import Dict, List, Optional, Union, Callable, Annotated, Literal
from random import randint
from pydantic import BaseModel, BeforeValidator, Field, ConfigDict, AliasChoices
from enum import Enum

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
    HOSTED_FUNCTION_TOOL = "function",
    RAG_TOOL = "rag",


class Platforms(str, Enum):
    ChatOpenAI = "open_ai"
    AzureChatOpenAI = "azure"
    FastEmbed = "fastembed"
    Ollama = "ollama"
    GoogleVertex = "google_vertex"
    Cohere = "cohere"
    Anthropic = "anthropic"
    Groq = "groq"


class ModelVariant(str, Enum):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    GPT4 = "gpt-4"
    GPT4TURBO = "gpt-4-1106-preview"
    GPT3TURBO = "gpt-3.5-turbo"
    GeminiPro = "gemini-pro"
    CommandRPlus = "command-r-plus"
    Opus = "claude-3-opus-20240229"
    Sonnet = "claude-3-sonnet-20240229"
    Haiku = "claude-3-haiku-20240307"
    LLaMA3_70b = "llama3-70b-8192"
    Mixtral_8x7b = "mixtral-8x7b-32768"


class FastEmbedModelsStandardFormat(str, Enum):
    FAST_BGE_SMALL_EN = 'fast-bge-small-en'
    FAST_BGE_SMALL_EN_V15 = 'fast-bge-small-en-v1.5'
    FAST_BGE_BASE_EN = 'fast-bge-base-en'
    FAST_BGE_BASE_EN_V15 = 'fast-bge-base-en-v1.5'
    FAST_ALL_MINILM_L6_V2 = 'fast-all-MiniLM-L6-v2'
    FAST_MULTILINGUAL_E5_LARGE = 'fast-multilingual-e5-large'

class FastEmbedModelsDocFormat(str, Enum):
    FAST_BGE_SMALL_EN = "BAAI/bge-small-en"
    FAST_BGE_SMALL_EN_V15 = "BAAI/bge-small-en-v1.5"
    FAST_BGE_BASE_EN = "BAAI/bge-base-en"
    FAST_BGE_BASE_EN_V15 = "BAAI/bge-base-en-v1.5"
    FAST_ALL_MINILM_L6_V2 = "sentence-transformers/all-MiniLM-L6-v2"
    FAST_MULTILINGUAL_E5_LARGE = "intfloat/multilingual-e5-large"

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


class Retriever(str, Enum):
    RAW = "raw" # no structured query formatting
    SELF_QUERY = "self_query"
    TIME_WEIGHTED = "time_weighted"
    MULTI_QUERY = "multi_query"


class MetadataFieldInfo(BaseModel):
    name: str
    description: str
    type: Literal["string", "integer", "float"]


class SelfQueryRetrieverConfig(BaseModel):
    k: Optional[int] = Field(default=4)
    metadata_field_info: Optional[List[MetadataFieldInfo]] = Field(default={})


class TimeWeightedRetrieverConfig(BaseModel):
    k: Optional[int] = Field(default=4)
    decay_rate: Optional[float] = Field(default=0.01)
    timeWeightField: Optional[str] = Field(default="last_accessed_at")


# Allows me to be lazy in the webapp and include retriever_config keys from multiple types
class CombinedRetrieverConfig(SelfQueryRetrieverConfig, TimeWeightedRetrieverConfig):
    pass


class Tool(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    name: str
    description: Optional[str] = None
    type: Optional[str] = "function"
    datasourceId: Optional[PyObjectId] = None
    data: Optional[ToolData] = None
    retriever_type: Optional[Retriever] = Retriever.SELF_QUERY
    retriever_config: Optional[Union[CombinedRetrieverConfig]] = None


class ApiCredentials(BaseModel):
    api_key: Optional[str] = Field(alias="key")
    base_url: Optional[str] = Field(alias="endpointURL")


class Credentials(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    type: Optional[Platforms] = Field(default=Platforms.ChatOpenAI)
    credentials: Optional[ApiCredentials] = None


class ModelType(str, Enum):
    llm = 'llm'
    embedding = 'embedding'


class Model(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    name: str
    model_name: Optional[str] = Field(default=ModelVariant.GPT4, alias="model")
    modelType: ModelType
    embeddingLength: Optional[int] = 384
    seed: Optional[int] = randint(1, 100)
    temperature: Optional[float] = 0
    timeout: Optional[int] = 300
    max_retries: Optional[int] = 10
    stream: Optional[bool] = True
    type: Optional[Platforms] = None
    config: Optional[Dict] = Field(default={})


class ChatModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    api_key: Optional[str] = None
    model_name: Optional[ModelVariant] = Field(default=ModelVariant.GPT4, alias="model")
    seed: Optional[int] = randint(1, 100)
    wtemperature: Optional[float] = 0
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
    name: Optional[str] = ''
    description: str
    expected_output: Optional[str] = Field(validation_alias=AliasChoices('expectedOutput', 'expected_output'))
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
    requiresHumanInput: bool = False


class Agent(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    """Data model for Autogen Agent Config"""
    name: str
    role: str
    goal: str
    backstory: str
    llm: Optional[Model] = ModelVariant.GPT4
    toolIds: Optional[List[PyObjectId]] = None
    taskIds: Optional[List[PyObjectId]] = None
    modelId: PyObjectId
    tools: Optional[List[Tool]] = None
    tasks: Optional[List[Task]] = None
    functionCallingLLM: Optional[Model] = ModelVariant.GPT4
    maxIter: Optional[int] = 10
    maxRPM: Optional[int] = 100
    verbose: Optional[bool] = False
    allowDelegation: Optional[bool] = True
    step_callback: Optional[Callable] = None


class Crew(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    tasks: Optional[List[PyObjectId]] = None
    agents: Optional[List[PyObjectId]] = None
    process: Optional[Process] = Process.Sequential
    managerLLM: Optional[Model] = None
    functionCallingLLM: Optional[Callable] = None
    verbose: Optional[bool] = False
    memory: Optional[bool] = False
    cache: Optional[bool] = False
    config: Optional[Dict] = {}
    maxRPM: Optional[int] = None
    language: Optional[str] = "en"
    fullOutput: Optional[bool] = False
    stepCallback: Optional[Callable] = None
    shareCrew: Optional[bool] = False
    modelId: Optional[PyObjectId] = Field(alias="managerModelId", default=None)


class Session(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    crewId: Crew


class Datasource(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    orgId: Optional[PyObjectId] = Field(default=None)
    teamId: Optional[PyObjectId] = Field(default=None)
    modelId: Optional[PyObjectId] = Field(default=None)
    name: str
    sourceId: PyObjectId
    sourceType: str
    embeddingField: Optional[str] = Field(default="page_content")
    workspaceId: PyObjectId
    connectionId: PyObjectId
    destinationId: PyObjectId

class AppType(str, Enum):
    CHAT = "chat"
    PROCESS = "process"


class App(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    appType: Optional[AppType] = Field(default=None)
    crewId: Optional[PyObjectId] = Field(default=None)
