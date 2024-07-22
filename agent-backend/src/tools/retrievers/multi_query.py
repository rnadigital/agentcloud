import logging
from textwrap import dedent

from langchain.retrievers.multi_query import MultiQueryRetriever as LC_MultiQueryRetriever
from langchain_core.prompts.prompt import PromptTemplate as LC_PromptTemplate
from langchain_core.language_models import BaseLanguageModel
from langchain_core.vectorstores import VectorStore

from .base import BaseToolRetriever
from models.mongo import Tool


class MultiQueryRetriever(BaseToolRetriever):
    def __init__(self, tool: Tool, llm: BaseLanguageModel, vector_store: VectorStore):
        self.tool = tool

        # Note: this prompt is from https://github.com/langchain-ai/langchain/blob/0c6a3fdd6bc8082ec09db63f65a8d3d0d1173e43/libs/langchain/langchain/retrievers/multi_query.py#L31
        # with a small modification to template the top k from retriever_config
        # prompt = LC_PromptTemplate(
        #     input_variables=["question"],
        #     template=dedent(f"""You are an AI language model assistant. Your task is 
        #     to generate {tool.retriever_config.k or 3} different versions of the given user 
        #     question to retrieve relevant documents from a vector  database. 
        #     By generating multiple perspectives on the user question, 
        #     your goal is to help the user overcome some of the limitations 
        #     of distance-based similarity search. Provide these alternative 
        #     questions separated by newlines. Original question: {{question}}""")
        # )

        self.retriever = LC_MultiQueryRetriever.from_llm(
            retriever=vector_store.as_retriever(),
            llm=llm,
            # prompt=prompt
        )
        logging.getLogger("langchain.retrievers.multi_query").setLevel(logging.DEBUG)
        super().__init__()
