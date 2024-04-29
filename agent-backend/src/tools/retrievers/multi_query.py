import logging

from langchain.retrievers.multi_query import MultiQueryRetriever as LC_MultiQueryRetriever
from langchain_core.language_models import BaseLanguageModel
from langchain_core.vectorstores import VectorStore

from .base import BaseToolRetriever
from models.mongo import Tool


class MultiQueryRetriever(BaseToolRetriever):
    def __init__(self, tool: Tool, llm: BaseLanguageModel, vector_store: VectorStore):
        self.tool = tool
        self.retriever = LC_MultiQueryRetriever.from_llm(retriever=vector_store.as_retriever(), llm=llm)
        logging.basicConfig()
        logging.getLogger("langchain.retrievers.multi_query").setLevel(logging.INFO)

    def perform_query(self, query):
        return self.retriever.invoke(query)

    def format_results(self, results):
        return "\n".join(map(lambda x: x if type(x) is str else x.page_content, results))
