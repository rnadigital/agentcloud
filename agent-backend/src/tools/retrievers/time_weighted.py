import datetime

from langchain.retrievers import TimeWeightedVectorStoreRetriever

from .base import BaseRetriever


class TimeWeightedRetriever(BaseRetriever):
    def __init__(self, tool, vector_store):
        self.retriever = TimeWeightedVectorStoreRetriever(vectorstore=vector_store,
                                                          decay_rate=tool.retriever_config.decay_rate)

    def run(self, query):
        results = self.retriever.get_relevant_documents(query)

        # Update timestamps
        for document in results:
            document.metadata.update({'last_accessed_at': datetime.datetime.now()})
            self.retriever.add_documents(document)
        return "\n".join(map(lambda x: x if type(x) is str else x.page_content, results))
