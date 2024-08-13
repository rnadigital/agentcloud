import logging
from langchain_core.embeddings import Embeddings
from langchain_community.vectorstores import VectorStore
from langchain_core.language_models import BaseLanguageModel

from models.mongo import Retriever, Tool
from .default import DefaultRetriever
from .self_query import SelfQueryRetriever
from .time_weighted import TimeWeightedRetriever
from .multi_query import MultiQueryRetriever


def retriever_factory(tool: Tool, vector_store: VectorStore, embedding: Embeddings, llm: BaseLanguageModel):
    metadata_field_info = tool.retriever_config.metadata_field_info
    for field in metadata_field_info:
        if isinstance(field.type, list) and 'null' in field.type:
            field.type = [t for t in field.type if t != 'null'][0]
    match tool.retriever_type:
        case Retriever.RAW:
            return DefaultRetriever(tool, embedding, vector_store)
        case Retriever.SELF_QUERY:
            return SelfQueryRetriever(tool, embedding, llm, vector_store)
        case Retriever.TIME_WEIGHTED:
            return TimeWeightedRetriever(tool, vector_store)
        case Retriever.MULTI_QUERY:
            return MultiQueryRetriever(tool, llm, vector_store)
