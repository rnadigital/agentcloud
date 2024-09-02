from langchain_community.vectorstores import Qdrant
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_core.embeddings import Embeddings
from langchain_core.retrievers import BaseRetriever
from langchain_core.vectorstores import VectorStore

from .base import BaseToolRetriever


class SimilaritySearchRetriever(BaseRetriever):
    embedding: Embeddings
    vector_store: VectorStore
    k: int

    def _get_relevant_documents(self, query: str, *, run_manager: CallbackManagerForRetrieverRun):
        embedded_question = self.embedding.embed_query(query)
        if isinstance(self.vector_store, Qdrant):
            return self.vector_store.similarity_search_with_score_by_vector(embedded_question, k=self.k)
        return self.vector_store.similarity_search_by_vector_with_score(embedded_question, k=self.k)
