from typing import Any, Dict, List, Optional, Union, Callable, Annotated, Literal
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
    BUILTIN_TOOL = "builtin"
    HOSTED_FUNCTION_TOOL = "function",
    RAG_TOOL = "rag",


class Platforms(str, Enum):
    ChatOpenAI = "open_ai"
    AzureChatOpenAI = "azure"
    FastEmbed = "fastembed"
    Ollama = "ollama"
    GoogleVertex = "google_vertex"
    GoogleAI = "google_ai"
    Cohere = "cohere"
    Anthropic = "anthropic"
    Groq = "groq"


class ModelVariant(str, Enum):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    GPT4 = "gpt-4"
    GPT4TURBO = "gpt-4-1106-preview"
    GPT3TURBO = "gpt-3.5-turbo"
    Gemini_1_Pro = "gemini-1.0-pro"
    Gemini_1_5_Pro = "gemini-1.5-pro"
    Gemini_1_5_Flash = "gemini-1.5-flash"
    CommandRPlus = "command-r-plus"
    Opus = "claude-3-opus-20240229"
    Sonnet = "claude-3-sonnet-20240229"
    Haiku = "claude-3-haiku-20240307"
    LLaMA3_70b = "llama3-70b-8192"
    LLaMA3_70b_Tool_Use = "llama3-groq-70b-8192-tool-use-preview"
    LLaMA3_8b_Tool_Use = "llama3-groq-8b-8192-tool-use-preview"
    Mixtral_8x7b = "mixtral-8x7b-32768"
    Llama3_Groq_8b_Tool_Use = "llama3-groq-tool-use"
    Llama3_Groq_70b_Tool_Use = "llama3-groq-tool-use:70b"
    Llama_3_1 = "llama3.1"


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
    properties: Dict[str, FunctionProperty]
    required: List[str]


class ToolData(BaseModel):
    name: str
    code: Optional[str] = ''
    description: Optional[str] = None
    parameters: Optional[ToolParameters] = None
    apiKey: Optional[str] = None
    builtin: bool


class Retriever(str, Enum):
    RAW = "raw"  # no structured query formatting
    SELF_QUERY = "self_query"
    TIME_WEIGHTED = "time_weighted"
    MULTI_QUERY = "multi_query"


# TODO: figure out integer vs float vs number
AllowedLiterals = Literal['string', 'integer', 'float', 'number', 'null']


class MetadataFieldInfo(BaseModel):
    name: str
    description: Optional[str] = ""
    type: Union[List[AllowedLiterals], AllowedLiterals]


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


class ToolState(str, Enum):
    PENDING = 'pending'
    READY = 'ready'
    ERROR = 'error'


class Tool(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    functionId: Optional[str] = None
    state: Optional[ToolState] = None
    name: str
    description: Optional[str] = None
    type: Optional[str] = "function"
    datasourceId: Optional[PyObjectId] = None
    data: Optional[ToolData] = None
    retriever_type: Optional[Retriever] = Retriever.SELF_QUERY
    retriever_config: Optional[Union[CombinedRetrieverConfig]] = None
    linkedToolId: Optional[PyObjectId] = None
    parameters: Optional[Dict[str, str]] = {}
    ragFilters: Optional[Dict] = None


class ApiCredentials(BaseModel):
    api_key: Optional[str] = Field(alias="key")
    base_url: Optional[str] = Field(alias="endpointURL")


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
    context: Optional[List[PyObjectId]] = None
    outputJSON: Optional[BaseModel] = None
    outputPydantic: Optional[BaseModel] = None
    outputFile: Optional[str] = None
    callback: Optional[Callable] = None
    requiresHumanInput: bool = False
    displayOnlyFinalOutput: bool = False
    storeTaskOutput: bool = False
    taskOutputFileName: Optional[str] = ''
    isStructuredOutput: Optional[bool] = False
    taskOutputVariableName: Optional[str] = None


class Agent(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
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
    allowDelegation: Optional[bool] = Field(default=False, alias="allow_delegation")
    step_callback: Optional[Callable] = None


class Crew(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_config = ConfigDict(extra='ignore')
    tasks: Optional[List[PyObjectId]] = None
    agents: Optional[List[PyObjectId]] = None
    process: Optional[Process] = Process.Sequential
    managerModelId: Optional[PyObjectId] = None
    functionCallingLLM: Optional[Callable] = None
    verbose: Optional[Union[int, bool]] = False
    memory: Optional[bool] = False
    cache: Optional[bool] = False
    config: Optional[Dict] = {}
    maxRPM: Optional[int] = None
    language: Optional[str] = "en"
    fullOutput: Optional[bool] = False
    full_output: Optional[bool] = Field(alias="fullOutput", default=False)
    stepCallback: Optional[Callable] = None
    shareCrew: Optional[bool] = False
    modelId: Optional[PyObjectId] = Field(alias="managerModelId", default=None)


class Session(BaseModel):
    id: PyObjectId = Field(alias="_id", default=None)
    appId: PyObjectId = None
    variables: Optional[Dict[str, str]] = None

class VectorDb(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    orgId: Optional[PyObjectId] = Field(default=None)
    teamId: Optional[PyObjectId] = Field(default=None)
    apiKey: Optional[str] = None
    url: Optional[str] = None
    name: str
    type: str




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
    collectionName: Optional[str] = None
    namespace: Optional[str] = None
    byoVectorDb: Optional[bool] = None
    vectorDbId: Optional[PyObjectId] = None
    vector_db: Optional[VectorDb] = None
    region: Optional[str] = None
    

class AppType(str, Enum):
    CHAT = "chat"
    PROCESS = "process"


class ChatAppConfig(BaseModel):
    agentId: PyObjectId
    conversationStarters: list[str] = Field(default_factory=list)
    maxMessages: int = Field(default=30)


class Variable(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    value: str


class App(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    appType: Optional[AppType] = Field(default=None)
    crewId: Optional[PyObjectId] = Field(default=None)
    chatAppConfig: Optional[ChatAppConfig] = None
