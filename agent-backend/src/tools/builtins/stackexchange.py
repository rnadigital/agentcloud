from langchain_community.utilities import StackExchangeAPIWrapper
from tools.builtins.base import BaseBuiltinTool


class StackExchangeTool(BaseBuiltinTool):
    stackexchange: StackExchangeAPIWrapper

    def __init__(self, **kwargs):
        kwargs["stackexchange"] = StackExchangeAPIWrapper()
        super().__init__(**kwargs)

    def run_tool(self, query: str) -> str:
        results = self.stackexchange.run(query)
        self.logger.debug(f"{self.__class__.__name__} search results: {results}")
        return results
