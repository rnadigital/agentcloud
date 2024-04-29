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
            decay_rate=tool.retriever_config.decay_rate)
        super().__init__()
