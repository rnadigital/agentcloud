import os

from langchain_community.utilities import ApifyWrapper
from langchain_core.documents import Document
from langchain_core.tools import ToolException

from tools.builtins.base import BaseBuiltinTool


class ApifyGoogleSearchTool(BaseBuiltinTool):
    apify: ApifyWrapper

    def __init__(self, **kwargs):
        kwargs["apify"] = ApifyWrapper(**kwargs["parameters"])
        super().__init__(**kwargs)

    def run_tool(self, query: str) -> str:
        loader = self.apify.call_actor(
            actor_id="apify/google-search-scraper",
            run_input={"queries": query},
            dataset_mapping_function=lambda item: Document(
                page_content=str(item["organicResults"]) + "\n" + str(item["paidResults"]),
                metadata={"source": item["url"]}
            ),
        )
        results = loader.load()
        self.logger.debug(f"{self.__class__.__name__} search results: {results}")
        return "\n".join(r.page_content for r in results)
