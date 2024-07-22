import datetime

from langchain_core.vectorstores import VectorStore

from models.mongo import Tool
from .base import BaseToolRetriever
from .custom.time_weighted_retriever import CustomTimeWeightedVectorStoreRetriever


class TimeWeightedRetriever(BaseToolRetriever):

    def __init__(self, tool: Tool, vector_store: VectorStore):
        self.tool = tool
        self.retriever = CustomTimeWeightedVectorStoreRetriever(
            vectorstore=vector_store,
            time_weight_field_name=tool.retriever_config.timeWeightField,
            decay_rate=tool.retriever_config.decay_rate,
            k=tool.retriever_config.k
        )
        super().__init__()

    def format_results(self, results):
        self.logger.debug(f"{self.__class__.__name__} results: {results}")
        return "\n".join(
            map(lambda x: x if type(x) is str else str({
                'data': x[0].page_content,
                'metadata': x[0].metadata,
                'time_weight_score': x[1]
            }), results))
