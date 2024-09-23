import logging
from abc import ABC

from langchain_core.retrievers import BaseRetriever

from models.mongo import Tool
from tools.retrievers.callback_handler import RetrieverCallbackHandler
from tools.retrievers.filters import create_qdrant_filters, create_pinecone_filters

class BaseToolRetriever(ABC):
    logger: logging.Logger
    tool: Tool
    retriever: BaseRetriever

    def __init__(self):
        self.init_logger()

    def init_logger(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.setLevel(logging.DEBUG)

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
        return self.retriever.invoke(query, config={
            'callbacks': [RetrieverCallbackHandler()],
            'tags': ['rag_retrieval'],
        })

    def format_results(self, results):
        self.logger.debug(f"{self.__class__.__name__} results: {results}")
        # Note: multi query retriever doesn't have a top k, so we'll slice the array here instead (for now).
        k = self.tool.retriever_config.k or 4
        return '\n'.join(map(self._result_getter, results[:k]))

    @staticmethod
    def _result_getter(result):
        match result:
            case str():
                return result
            case tuple():
                return str({
                    'data': result[0].page_content,
                    'metadata': result[0].metadata,
                    'score': result[1]
                })
            case _:
                # return result.page_content
                return str({
                    'data': result.page_content,
                    'metadata': result.metadata,
                })