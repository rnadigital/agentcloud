from langchain_community.document_loaders import AsyncChromiumLoader
from langchain_community.document_loaders import FireCrawlLoader
from tools.builtins.base import BaseBuiltinTool

class FireCrawlLoader(BaseBuiltinTool):
    loader = FireCrawlLoader

    def __init__(self, *args, **kwargs):
        print(f"KWARGS: {kwargs}")
        parameters: dict = kwargs.get("parameters")
        if parameters is not None:
            print(f"PARAMETERS: {parameters}")
            api_key:str = parameters.get("firecrawl_api_key")
            print(f"API KEY: {api_key}")
            kwargs["loader"] = FireCrawlLoader(api_key)
            super().__init__(**kwargs)
        else:
            print("Parameters was None!")

    def run_tool(self, query: str) -> str:
        data = FireCrawlLoader(url = query, mode = "scrape")
        return data