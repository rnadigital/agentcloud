from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import VectorStore

from .base import BaseToolRetriever


class DefaultRetriever(BaseToolRetriever):
    def __init__(self, embedding: Embeddings, vector_store: VectorStore):
        self.embedding = embedding
        self.vector_store = vector_store

    def run(self, query):
        embedded_question = self.embedding.embed_query(query)
        search_results = self.vector_store.similarity_search_by_vector(embedded_question, k=4)
        print("SEARCH RESULTS", search_results)
        return "\n".join(map(lambda x: x if type(x) is str else x.page_content,
                             search_results))  # assuming this is langchain_core.documents.Document or containts Document
