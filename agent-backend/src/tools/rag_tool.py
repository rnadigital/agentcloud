from dataclasses import Field
from typing import Callable, List
from langchain.pydantic_v1 import BaseModel
from langchain_community.vectorstores import VectorStore
from langchain_core.embeddings import Embeddings
from langchain_community.tools import Tool

###### INSTANTIATE FROM FACTORY CLASS (AT BOTTOM) UNLESS YOU KNOW REALLY MEAN IT ######

class RagTool:
    """
    DO NOT INSTANTIATE DIRECTLY. USE FACTORY CLASS AT END OF FILE (UNLESS YOU REALLY WANT TO).

    Args:
        vector_store: can be any vector store in langchain_community.vectorstores
        embedding: can be any embedding in langchain_community.embeddings
        pre_processors: list of pre-processor functions that take in a query or series of queries
                        and returns a series of queries prepared for embedding and searching.
                        Pre-processors can be self-queries or multi-queries. Such examples take
                        a single query and enghances by adding metadata or by asking the question
                        in a better way or asking many questions isntead of one
        post_processors: list of post-processor functions that take in returned documents
                         and returns a series of documents or strings. Examples include
                         Document retrieval, where the result causes the entire related document
                         from the document store to be retrieved. Contextual comrpession is another example.
                         Results can be further filtered, re-ranked based on the document metadata.
        
        further examples of pre and post processors: https://python.langchain.com/docs/modules/data_connection/retrievers/
    """

    def __init__(self, vector_store: VectorStore, embedding: Embeddings, pre_processors = [], post_processors = []):
        self.vector_store = vector_store
        self.embedding = embedding
        self.pre_processors = pre_processors
        self.post_processors = post_processors

    vector_store: VectorStore = None
    embedding: Embeddings = None
    pre_processors: List[Callable] = []
    post_processors: List[Callable] = []

    def _validate_instance(self):
        "valdiate vector_sotre and embedding"
        "later validate callables"

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

    def search(self, query: str):
        """ Returns search results"""
        search_results = []
        pre_data = [query]
        for pre_processor in self.pre_processors:
            pre_data = pre_processor(pre_data)
        if hasattr(pre_data, '__iter__') == False:
            pre_data = [pre_data]
        for pre_data_question in pre_data:
            embedded_question = self.embedding.embed_query(pre_data_question)
            res = self.vector_store.similarity_search_by_vector(embedded_question, k=4)
            search_results.append(res)
        for post_processor in self.post_processors:
            search_results = post_processor(search_results)
        return "\n".join(map(lambda x: x if type(x) is str else (x.payload["document"] if "document" in x.payload else x.payload["page_content"]), search_results)) # assuming this is langchain_core.documents.Document or containts Document
    

class RagToolArgsSchema(BaseModel):
    query: str

    def __init__(self, query: str):
        return query

_default_tool_name = "document_retrieval_tool"
_default_tool_description = "Returns information from a search"

class RagToolFactory:
    """First call init(...) method to cerate set up the retrieval, then call generate_langchain_tool(...) to convert to a tool ready for Crew"""

    tool_instance: RagTool = None
    
    def init(self, vector_store: VectorStore, embedding: Embeddings, pre_processors = [], post_processors = []):
        self.tool_instance = RagTool(vector_store, embedding, pre_processors, post_processors)

    def generate_langchain_tool(self, tool_name: str = _default_tool_name, tool_dsecription: str = _default_tool_description):
        return Tool(name=tool_name, description=tool_dsecription, func=self.tool_instance.search, args_schema=RagToolArgsSchema)