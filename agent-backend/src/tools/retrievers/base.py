import logging
from abc import ABC

from langchain_core.retrievers import BaseRetriever

from models.mongo import Tool
from tools.retrievers.callback_handler import RetrieverCallbackHandler


class BaseToolRetriever(ABC):
    logger: logging.Logger
    tool: Tool
    retriever: BaseRetriever

    def __init__(self):
        self.init_logger()

    def run(self, query):
        # Perform the query and get results
        results = self.perform_query(query)
        print(f"RAG query results: {results}")
        if not results or len(results) == 0:
            return f"NO RESULTS FOUND IN DATASOURCE \"{self.tool.name}\" FOR QUERY: \"{query}\""
        formatted_results = self.format_results(results)
        print(f"RAG formatted response: {formatted_results}")
        return formatted_results

    def perform_query(self, query):
        self.logger.debug(
            f"{self.__class__.__name__} in tool: '{self.tool.name}', retriever_config: {self.tool.retriever_config}")
        return self.retriever.invoke(query, config={'callbacks': [RetrieverCallbackHandler()]})

    def format_results(self, results):
        self.logger.debug(f"{self.__class__.__name__} results: {results}")
        return "\n".join(map(lambda x: x if type(x) is str else x.page_content, results))

    def init_logger(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.setLevel(logging.DEBUG)
