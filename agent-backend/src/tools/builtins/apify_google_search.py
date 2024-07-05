import os

from langchain_community.utilities import ApifyWrapper
from langchain_core.documents import Document
from langchain_core.tools import ToolException

from tools.builtins.base import BaseBuiltinTool


class ApifyGoogleSearchTool(BaseBuiltinTool):
    apify: ApifyWrapper

    def __init__(self, **kwargs):
        # TODO: change to pass named param `apify_api_token` when new version of langchain_community is released with
        #  this commit -> https://github.com/langchain-ai/langchain/commit/2d81a72884c46744ba3ac764efe7f37ece24452a
        if not os.environ.get("APIFY_API_TOKEN"):
            if not kwargs["api_key"]:
                raise Exception("Empty value received for required param `api_key`")
            os.environ["APIFY_API_TOKEN"] = kwargs["api_key"]

        kwargs["apify"] = ApifyWrapper()
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
