import re

from typing import Any, List, Tuple, Type

from langchain_core.language_models import BaseLanguageModel
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_core.embeddings import Embeddings
from langchain.tools import BaseTool

from .global_tools import GlobalBaseTool
from models.mongo import Model, Tool, Datasource

from vectorstores.factory import vectorstore_factory

from langchain_community.vectorstores.qdrant import Qdrant #TODO: remove
from langchain_community.vectorstores.pinecone import Pinecone #TODO: remove

from .retrievers import BaseToolRetriever, retriever_factory


###### INSTANTIATE FROM FACTORY CLASS (AT BOTTOM) UNLESS YOU KNOW REALLY MEAN IT ######


class RagToolArgsSchema(BaseModel):
    query: str = Field(description="Retrieval argument")


class RagTool(GlobalBaseTool):
    """
    DO NOT INSTANTIATE DIRECTLY. USE FACTORY METHOD AT END OF FILE (UNLESS YOU REALLY WANT TO).

    Args:
        vector_store: can be any vector store in langchain_community.vectorstores
        embedding: can be any embedding in langchain_community.embeddings
        pre_processors: list of pre-processor functions that take in a query or series of queries
                        and returns a series of queries prepared for embedding and searching.
                        Pre-processors can be self-queries or multi-queries. Such examples take
                        a single query and enhances by adding metadata or by asking the question
                        in a better way or asking many questions instead of one
        post_processors: list of post-processor functions that take in returned documents
                         and returns a series of documents or strings. Examples include
                         Document retrieval, where the result causes the entire related document
                         from the document store to be retrieved. Contextual compression is another example.
                         Results can be further filtered, re-ranked based on the document metadata.
        
        further examples of pre and post processors: https://python.langchain.com/docs/modules/data_connection/retrievers/
    """

    DEFAULT_NAME = "document_retrieval_tool"
    DEFAULT_DESCRIPTION = "Returns information from a search"
    name: str = Field(default=DEFAULT_NAME)
    description: str = Field(DEFAULT_DESCRIPTION)
    args_schema: Type[BaseModel] = RagToolArgsSchema
    retriever: BaseToolRetriever

    @classmethod
    def factory(cls, tool: Tool, datasources: List[Datasource], models: List[Tuple[Any, Model]],
                llm: BaseLanguageModel = None) -> BaseTool:
        assert len(datasources) == 1
        assert isinstance(datasources[0], Datasource)

        datasource = datasources[0]

        assertion_message = f"The model for the datasource \"{datasource.name}\" used by RAG tool \"{tool.name}\" has an invalid or missing model."
        assert len(models) == 1, assertion_message
        assert isinstance(models[0][0], Embeddings), assertion_message
        assert isinstance(models[0][1], Model), assertion_message
        
        embedding_model = models[0][0]

        vector_db = datasource.vector_db if datasource.byoVectorDb else None
        type = vector_db.type if vector_db else None
        api_key = vector_db.apiKey if vector_db else None
        url = vector_db.url if vector_db else None
        namespace = datasource.namespace
        collection = datasource.collectionName if datasource.byoVectorDb else datasource.region

        vector_store = vectorstore_factory(embedding_model=embedding_model, collection_name=collection, tool=tool,  api_key=api_key, url=url, type=type, namespace=namespace, byoVectorDb=datasource.byoVectorDb)

        return RagTool(name=tool.name,
                       description=tool.description,
                       retriever=retriever_factory(tool, vector_store, embedding_model, llm))

    def __init__(self, **kwargs):
        # Monkey-patching `similarity_search` because that's what's called by
        # self_query and multi_query retrievers internally, but we want scores too
        Qdrant.similarity_search = Qdrant.similarity_search_with_score
        Pinecone.similarity_search = Pinecone.similarity_search_with_score
        super().__init__(**kwargs)

    @staticmethod
    def extract_query_value(query):
        res = re.findall('["\']?(?:query|text)["\']?:\s*["\']?([\w\s]+)["\']?', query)
        return res[0] if res else query

    def _run(self, query):
        print(f"{self.__class__.__name__} received {query}")
        # TODO: should figure a better way to do this... ideally using LLM itself
        query_value = self.extract_query_value(query)
        print("query_value => ", query_value)
        """ Returns search results via configured retriever """
        return self.retriever.run(query_value)

    def __del__(self):
        # Restore to earlier state
        Qdrant.similarity_search = Qdrant.similarity_search
        Pinecone.similarity_search = Pinecone.similarity_search
