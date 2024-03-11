from typing import Callable, List, Type
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_community.vectorstores import VectorStore
from langchain_core.embeddings import Embeddings
# from langchain_community.tools import Tool
from langchain.tools import BaseTool
import json


###### INSTANTIATE FROM FACTORY CLASS (AT BOTTOM) UNLESS YOU KNOW REALLY MEAN IT ######


class RagToolArgsSchema(BaseModel):
    query: str = Field(description="Retrieval argument")


class RagTool(BaseTool):
    """
    DO NOT INSTANTIATE DIRECTLY. USE FACTORY CLASS AT END OF FILE (UNLESS YOU REALLY WANT TO).

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
    vector_store: VectorStore
    embedding: Embeddings
    pre_processors: List[Callable] = Field(default=list())
    post_processors: List[Callable] = Field(default=list())
    args_schema: Type[BaseModel] = RagToolArgsSchema

    # def __hash__(self) -> int:
    #     return hash((
    #         self.vector_store.__class__.__name__ if self.vector_store else "",
    #         self.embedding.model_name if self.embedding else "",
    #         self.name,
    #         self.description))

    # def _validate_instance(self):
    #     """validate vector_store and embedding"""
    #     "later validate callables"

    def register_pre_processors(self, functions: Callable | List[Callable]):
        if hasattr(functions, '__iter__'):
            for func in functions:
                self.pre_processors.append(func)
        else:
            self.pre_processors.append(functions)

    def register_post_processors(self, functions: Callable | List[Callable]):
        if hasattr(functions, '__iter__'):
            for func in functions:
                self.post_processors.append(func)
        else:
            self.post_processors.append(functions)

    def _run(self, query):
        processed_query = query
        try:
            json_obj = json.loads(query)
            processed_query = json_obj["query"]
        except:
            pass
        print("query => ", processed_query)
        """ Returns search results"""
        search_results = []
        pre_data = [processed_query]
        for pre_processor in self.pre_processors:
            pre_data = pre_processor(pre_data)
        if hasattr(pre_data, '__iter__') == False:
            pre_data = [pre_data]
        for pre_data_question in pre_data:
            embedded_question = self.embedding.embed_query(pre_data_question)
            # print("SEARCH QUESTION", pre_data_question, embedded_question)
            res = self.vector_store.similarity_search_by_vector(embedded_question, k=4)
            search_results += res
        for post_processor in self.post_processors:
            search_results = post_processor(search_results)
            print("SEARCH RESULTS", search_results)
        return "\n".join(map(lambda x: x if type(x) is str else x.page_content,
                             search_results))  ## assuming this is langchain_core.documents.Document or containts Document

# class RagToolFactory:
#     """First call init(...) method to create set up the retrieval, then call generate_langchain_tool(...) to convert to a tool ready for Crew"""

#     tool_instance: RagTool = None

#     def init(self, vector_store: VectorStore, embedding: Embeddings, pre_processors=list(), post_processors=list()):
#         self.tool_instance = RagTool(vector_store, embedding, pre_processors, post_processors)

#     def generate_langchain_tool(self, tool_name: str = _default_tool_name,
#                                 tool_description: str = _default_tool_description):
#         return Tool(name=tool_name, description=tool_description + '. You must use argument "query" as string input', func=self.tool_instance.search
#                     ,args_schema=RagToolArgsSchema)
