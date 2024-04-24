from langchain.chains.query_constructor.schema import AttributeInfo
from langchain.retrievers import SelfQueryRetriever as LC_SelfQueryRetriever

from models.mongo import SelfQueryRetrieverConfig
from .base import BaseRetriever


class SelfQueryRetriever(BaseRetriever):
    def __init__(self, tool, llm, vector_store):
        metadata_field_info = list(
            map(lambda x: AttributeInfo(**x.model_dump()), tool.retriever_config.metadata_field_info))

        # TODO: Change the `document_contents` param value from `tool.description` to something else
        self.retriever = LC_SelfQueryRetriever.from_llm(llm, vector_store, tool.description, metadata_field_info)

    def run(self, query):
        results = self.retriever.invoke(query)
        return "\n".join(map(lambda x: x if type(x) is str else x.page_content, results))
