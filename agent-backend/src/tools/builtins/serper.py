from langchain_community.utilities import GoogleSerperAPIWrapper

from tools.builtins.base import BaseBuiltinTool


class SerperGoogleSearchTool(BaseBuiltinTool):
    serper: GoogleSerperAPIWrapper

    def __init__(self, **kwargs):
        kwargs["serper"] = GoogleSerperAPIWrapper(**kwargs["parameters"])
        super().__init__(**kwargs)

    def run_tool(self, query: str) -> str:
        results = self.serper.run(query)
        self.logger.debug(f"{self.__class__.__name__} search results: {results}")
        return results
