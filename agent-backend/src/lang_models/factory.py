from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_core.embeddings import Embeddings
from langchain_core.language_models import BaseLanguageModel
from langchain_openai import OpenAIEmbeddings, ChatOpenAI, AzureChatOpenAI

import models.mongo
from utils.model_helper import in_enums, get_enum_value_from_str_key, get_enum_key_from_value


def model_factory(agentcloud_model: models.mongo.Model, credential: models.mongo.Credentials) -> BaseLanguageModel | Embeddings:
    """
    Return a (llm or embedding) langchain model based on credentials and model specs in mongo
    """
    match credential.type:
        case models.mongo.Platforms.ChatOpenAI:
            return _build_openai_model_with_credential(agentcloud_model, credential)
        case models.mongo.Platforms.AzureChatOpenAI:
            return _build_azure_model_with_credential(agentcloud_model, credential)
        case models.mongo.Platforms.FastEmbed:
            return _build_fastembed_model_with_credential(agentcloud_model, credential)


def _build_openai_model_with_credential(model: models.mongo.Model,
                                        credential: models.mongo.Credentials) -> BaseLanguageModel | Embeddings:
    if model.modelType == models.mongo.ModelType.embedding:
        return OpenAIEmbeddings(
            api_key=credential.credentials.api_key,
            model=model.model_name,
            **model.model_dump(
                exclude_none=True,
                exclude_unset=True,
                exclude={
                    "id",
                    "credentialId",
                    "modelType",
                    "model_name",
                    "name",
                    "embeddingLength"
                }
            )
        )
    else:
        return ChatOpenAI(
            api_key=credential.credentials.api_key,
            **model.model_dump(
                exclude_none=True,
                exclude_unset=True,
                exclude={
                    "id",
                    "credentialId",
                    "embeddingLength",
                    "modelType"
                }
            )
        )


def _build_azure_model_with_credential(model: models.mongo.Model,
                                       credential: models.mongo.Credentials) -> BaseLanguageModel:
    return AzureChatOpenAI(
        api_key=credential.credentials.api_key,
        **model.model_dump(
            exclude_none=True,
            exclude_unset=True,
            exclude={
                "id",
                "credentialId",
                "embeddingLength"
            }
        )
    )


def _build_fastembed_model_with_credential(model: models.mongo.Model,
                                           credential: models.mongo.Credentials) -> Embeddings:
    overwrite_model_name = _fastembed_standard_doc_name_swap(
        model.model_name,
        from_standard_to_doc=True
    )
    return FastEmbedEmbeddings(
        **model.model_dump(exclude_none=True, exclude_unset=True,
                           exclude={
                               "id",
                               "name",
                               "embeddingLength",
                               "model_name"}),
        model_name=overwrite_model_name)


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
