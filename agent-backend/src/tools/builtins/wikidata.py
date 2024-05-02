from typing import Type

from langchain_community.tools.wikidata.tool import WikidataAPIWrapper, WikidataQueryRun
from langchain_core.tools import ToolException, BaseTool

from tools.builtins.base import BaseBuiltinTool


class WikidataTool(BaseBuiltinTool):
    wikidata: WikidataQueryRun

    def __init__(self, **kwargs):
        kwargs["wikidata"] = WikidataQueryRun(api_wrapper=WikidataAPIWrapper())
        super().__init__(**kwargs)

    def run_tool(self, query: str) -> str:
        results = self.wikidata.run(query)
        self.logger.debug(f"{self.__class__.__name__} search results: {results}")
        return results

