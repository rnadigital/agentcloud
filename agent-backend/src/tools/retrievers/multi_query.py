import logging

from langchain.retrievers.multi_query import MultiQueryRetriever as LC_MultiQueryRetriever
from langchain_core.language_models import BaseLanguageModel
from langchain_core.vectorstores import VectorStore

from .base import BaseToolRetriever


class MultiQueryRetriever(BaseToolRetriever):
    def __init__(self, llm: BaseLanguageModel, vector_store: VectorStore):
        self.retriever = LC_MultiQueryRetriever.from_llm(retriever=vector_store.as_retriever(), llm=llm)
        logging.basicConfig()
        logging.getLogger("langchain.retrievers.multi_query").setLevel(logging.INFO)

    def run(self, query):
        results = self.retriever.invoke(query)
        return "\n".join(map(lambda x: x if type(x) is str else x.page_content, results))
