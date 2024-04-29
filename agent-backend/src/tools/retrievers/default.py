from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import VectorStore

from .base import BaseToolRetriever
from models.mongo import Tool


class DefaultRetriever(BaseToolRetriever):
    def __init__(self, tool: Tool, embedding: Embeddings, vector_store: VectorStore):
        self.tool = tool
        self.embedding = embedding
        self.vector_store = vector_store

    def perform_query(self, query):
        embedded_question = self.embedding.embed_query(query)
        return self.vector_store.similarity_search_by_vector(embedded_question, k=4)

    def format_results(self, results):
        return "\n".join(map(lambda x: x if type(x) is str else x.page_content, results))
