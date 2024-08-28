import json

from google.oauth2 import service_account
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_core.embeddings import Embeddings
from langchain_core.language_models import BaseLanguageModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama
from langchain_openai import OpenAIEmbeddings, ChatOpenAI, AzureChatOpenAI
from langchain_google_vertexai import ChatVertexAI
from langchain_anthropic import ChatAnthropic

from utils.dict_utils import exclude_items
from .cohere import CustomChatCohere
import models.mongo
from utils.model_helper import in_enums, get_enum_value_from_str_key, get_enum_key_from_value


def model_factory(agentcloud_model: models.mongo.Model) -> BaseLanguageModel | Embeddings:
    """
    Return a (llm or embedding) langchain model based on model specs in mongo
    """
    match agentcloud_model.type:
        case models.mongo.Platforms.ChatOpenAI:
            return _build_openai_model(agentcloud_model)
        case models.mongo.Platforms.AzureChatOpenAI:
            return _build_azure_model(agentcloud_model)
        case models.mongo.Platforms.FastEmbed:
            return _build_fastembed_model(agentcloud_model)
        case models.mongo.Platforms.Ollama:
            return _build_ollama_model(agentcloud_model)
        case models.mongo.Platforms.GoogleVertex:
            return _build_google_vertex_ai_model(agentcloud_model)
        case models.mongo.Platforms.GoogleAI:
            return _build_google_ai_model(agentcloud_model)
        case models.mongo.Platforms.Cohere:
            return _build_cohere_model(agentcloud_model)
        case models.mongo.Platforms.Anthropic:
            return _build_anthropic_model(agentcloud_model)
        case models.mongo.Platforms.Groq:
            return _build_groq_model(agentcloud_model)


def _build_ollama_model(model: models.mongo.Model) -> BaseLanguageModel:
    return ChatOllama(
        **model.model_dump(
            exclude_none=True,
            exclude_unset=True
        ).get('config')
    )


def _build_openai_model(model: models.mongo.Model) -> BaseLanguageModel | Embeddings:
    if model.modelType == models.mongo.ModelType.embedding:
        return OpenAIEmbeddings(
            **model.model_dump(
                exclude_none=True,
                exclude_unset=True,
            ).get('config'),
        )
    else:
        return ChatOpenAI(
            **model.model_dump(
                exclude_none=True,
                exclude_unset=True,
            ).get('config'),
        )


def _build_azure_model(model: models.mongo.Model) -> BaseLanguageModel:
    return AzureChatOpenAI(
        **model.model_dump(
            exclude_none=True,
            exclude_unset=True,
        ).get('config')
    )


def _build_fastembed_model(model: models.mongo.Model) -> Embeddings:
    overwrite_model_name = _fastembed_standard_doc_name_swap(
        model.model_name,
        from_standard_to_doc=True
    )
    return FastEmbedEmbeddings(model_name=overwrite_model_name)


def _fastembed_standard_doc_name_swap(fastembed_model_name: str, from_standard_to_doc: bool):
    from_enum = models.mongo.FastEmbedModelsStandardFormat if from_standard_to_doc else models.mongo.FastEmbedModelsDocFormat
    to_enum = models.mongo.FastEmbedModelsDocFormat if from_standard_to_doc else models.mongo.FastEmbedModelsStandardFormat
    if in_enums(enums=[to_enum], value=fastembed_model_name):
        return fastembed_model_name
    elif in_enums(enums=[from_enum], value=fastembed_model_name):
        return get_enum_value_from_str_key(
            to_enum,
            get_enum_key_from_value(
                from_enum,
                fastembed_model_name
            )
        )


def _build_google_vertex_ai_model(model: models.mongo.Model) -> BaseLanguageModel:
    credentials_info = json.loads(model.config.get('credentials'))
    model_config = model.model_dump(exclude_none=True, exclude_unset=True).get('config')

    model_params = exclude_items(model_config, ['credentials'])
    credentials = service_account.Credentials.from_service_account_info(credentials_info)

    return ChatVertexAI(**model_params, credentials=credentials)


def _build_google_ai_model(model: models.mongo.Model) -> BaseLanguageModel:
    return ChatGoogleGenerativeAI(
        **model.model_dump(
            exclude_none=True,
            exclude_unset=True,
        ).get('config')
    )


def _build_cohere_model(model: models.mongo.Model) -> BaseLanguageModel:
    return CustomChatCohere(
        **model.model_dump(
            exclude_none=True,
            exclude_unset=True,
        ).get('config')
    )


def _build_anthropic_model(model: models.mongo.Model) -> BaseLanguageModel:
    return ChatAnthropic(
        **model.model_dump(
            exclude_none=True,
            exclude_unset=True,
        ).get('config')
    )


def _build_groq_model(model: models.mongo.Model) -> BaseLanguageModel:
    return ChatGroq(
        **model.model_dump(
            exclude_none=True,
            exclude_unset=True,
        ).get('config'),
        model_name=model.config.get('model')
    )
