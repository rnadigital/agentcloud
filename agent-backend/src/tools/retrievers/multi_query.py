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
        logging.getLogger("langchain.retrievers.multi_query").setLevel(logging.DEBUG)
        super().__init__()
