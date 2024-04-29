from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_core.embeddings import Embeddings
from langchain_core.retrievers import BaseRetriever
from langchain_core.vectorstores import VectorStore

from .base import BaseToolRetriever


class SimilaritySearchRetriever(BaseRetriever):
    embedding: Embeddings

    vector_store: VectorStore

    def _get_relevant_documents(self, query: str, *, run_manager: CallbackManagerForRetrieverRun):
        embedded_question = self.embedding.embed_query(query)
        return self.vector_store.similarity_search_by_vector(embedded_question, k=4)
