from langchain_community.tools import YouTubeSearchTool as LC_YouTubeSearchTool
from tools.builtins.base import BaseBuiltinTool


class YoutubeSearchTool(BaseBuiltinTool):
    yt: LC_YouTubeSearchTool

    def __init__(self, **kwargs):
        kwargs["yt"] = LC_YouTubeSearchTool()
        super().__init__(**kwargs)

    def run_tool(self, query: str) -> str:
        results = self.yt.run(query)
        self.logger.debug(f"{self.__class__.__name__} search results: {results}")
        return results
