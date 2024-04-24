from .base import BaseRetriever


class DefaultRetriever(BaseRetriever):
    def __init__(self, embedding, vector_store):
        self.embedding = embedding
        self.vector_store = vector_store

    def run(self, query):
        embedded_question = self.embedding.embed_query(query)
        search_results = self.vector_store.similarity_search_by_vector(embedded_question, k=4)
        print("SEARCH RESULTS", search_results)
        return "\n".join(map(lambda x: x if type(x) is str else x.page_content,
                             search_results))  # assuming this is langchain_core.documents.Document or containts Document
