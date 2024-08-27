from langchain.chains.query_constructor.schema import AttributeInfo
from langchain.retrievers import SelfQueryRetriever as LC_SelfQueryRetriever
from langchain_core.embeddings import Embeddings
from langchain_core.language_models import BaseLanguageModel
from langchain_core.vectorstores import VectorStore
from models.mongo import Tool
from .base import BaseToolRetriever

class SelfQueryRetriever(BaseToolRetriever):
    def __init__(self, tool: Tool, embedding: Embeddings, llm: BaseLanguageModel, vector_store: VectorStore):
        self.tool = tool
        self.metadata_field_info = list(
            map(lambda x: AttributeInfo(**x.model_dump()), tool.retriever_config.metadata_field_info))
        self.retriever = LC_SelfQueryRetriever.from_llm(
            llm=llm,
            vectorstore=vector_store,
            document_contents=tool.description,
            metadata_field_info=self.metadata_field_info,
            search_kwargs={'k': tool.retriever_config.k},
            verbose=True,
        )
        super().__init__()

    def perform_query(self, query):
        self.logger.info(f"metadata_field_info: {self.metadata_field_info}")
        query_result = super().perform_query(query)
        self.logger.info(f"query result: {query_result}")
        return query_result
