from langchain_community.tools import DuckDuckGoSearchResults

from tools.builtins.base import BaseBuiltinTool


class DuckDuckGoSearchTool(BaseBuiltinTool):
    ddg: DuckDuckGoSearchResults

    def __init__(self, **kwargs):
        kwargs["ddg"] = DuckDuckGoSearchResults()
        super().__init__(**kwargs)

    def run_tool(self, query: str) -> str:
        results = self.ddg.run(query)
        self.logger.debug(f"{self.__class__.__name__} search results: {results}")
        return results
