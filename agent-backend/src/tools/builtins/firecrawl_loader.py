from langchain_community.document_loaders import FireCrawlLoader
from tools.builtins.base import BaseBuiltinTool

class fireCrawlLoader(BaseBuiltinTool):
    loader = fireCrawlLoader

    def __init__(self, **kwargs):
        kwargs["htmlloader"] = fireCrawlLoader()
        super().__init__(**kwargs)

    def run_tool(self, query: str) -> str:
        self.logger.info(f"{self.__class__.__name__} scraping url: '{query}'")
        data = loader.load(query)
        return data