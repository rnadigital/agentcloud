import datetime

from langchain_core.vectorstores import VectorStore

from models.mongo import Tool
from .base import BaseToolRetriever
from .custom.time_weighted_retriever import CustomTimeWeightedVectorStoreRetriever


class TimeWeightedRetriever(BaseToolRetriever):
    def __init__(self, tool: Tool, vector_store: VectorStore):
        self.tool = tool
        self.time_weight_field_name = tool.retriever_config.timeWeightField
        self.retriever = CustomTimeWeightedVectorStoreRetriever(vectorstore=vector_store,
                                                                time_weight_field_name=self.time_weight_field_name,
                                                                decay_rate=tool.retriever_config.decay_rate)

    def perform_query(self, query):
        return self.retriever.invoke(query)

    def format_results(self, results):
        return "\n".join(map(lambda x: x if type(x) is str else x.page_content, results))
