from langchain_community.document_loaders import AsyncChromiumLoader
from langchain_community.document_loaders import FireCrawlLoader
from pydantic import PrivateAttr
from tools.builtins.base import BaseBuiltinTool
import requests

class FireCrawlLoader(BaseBuiltinTool):

    def __init__(self, *args, **kwargs):
        super().__init__(**kwargs)
        parameters: dict = kwargs.get("parameters")
        if parameters is not None:
            self.__dict__['_api_key'] = parameters.get("api_key", "")
        else:
            print("Parameters was None!")

    def run_tool(self, query: str) -> str:
        if not getattr(self, '_api_key', None):
            raise ValueError("API key is not set!") #type saftey
        
        # Use the API key for running the tool logic
        url = "https://api.firecrawl.dev/v1/scrape"
        payload = {
        "url": query
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json"
        }
        response = requests.request('POST', url, json=payload, headers=headers)
        responseJson = response.json()
        return responseJson