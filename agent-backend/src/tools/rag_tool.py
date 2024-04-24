from typing import Any, Callable, List, Tuple, Type

from langchain_core.language_models import BaseLanguageModel
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_community.vectorstores import VectorStore
from langchain_core.embeddings import Embeddings
from langchain.tools import BaseTool
import json

from .global_tools import GlobalBaseTool
from models.mongo import Model, Tool, Datasource
from init.env_variables import QDRANT_HOST
from langchain_community.vectorstores.qdrant import Qdrant
from qdrant_client import QdrantClient

from .retrievers import BaseRetriever, retriever_factory


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
    retriever: BaseRetriever

    @classmethod
    def factory(cls, tool: Tool, datasources: List[Datasource], models: List[Tuple[Any, Model]],
                llm: BaseLanguageModel = None) -> BaseTool:
        assert len(datasources) == 1
        assert isinstance(datasources[0], Datasource)

        datasource = datasources[0]

        assert len(models) == 1
        assert isinstance(models[0][0], Embeddings)
        assert isinstance(models[0][1], Model)

        embedding_model = models[0][0]
        model_data = models[0][1]

        collection = str(datasource.id)

        vector_store = Qdrant(
            client=QdrantClient(QDRANT_HOST),
            collection_name=collection,
            embeddings=embedding_model,
            vector_name=model_data.model_name,
            content_payload_key="page_content"
        )

        embedding = embedding_model

        return RagTool(name=tool.name,
                       description=tool.description,
                       retriever=retriever_factory(tool, vector_store, embedding, llm))

    def _run(self, query):
        processed_query = query
        try:
            json_obj = json.loads(query)
            processed_query = json_obj["query"]
        except:
            pass
        print("query => ", processed_query)
        """ Returns search results via configured retriever """
        return self.retriever.run(processed_query)
