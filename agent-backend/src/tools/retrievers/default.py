from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import VectorStore

from models.mongo import Tool
from .base import BaseToolRetriever
from .callback_handler import RetrieverCallbackHandler
from .similarity_search import SimilaritySearchRetriever


class DefaultRetriever(BaseToolRetriever):
    def __init__(self, tool: Tool, embedding: Embeddings, vector_store: VectorStore):
        self.tool = tool
        self.retriever = SimilaritySearchRetriever(
            embedding=embedding,
            vector_store=vector_store,
            k=tool.retriever_config.k,
            rag_filters=tool.ragFilters
        )
        super().__init__()
