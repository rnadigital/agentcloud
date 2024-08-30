import logging
import re
from abc import abstractmethod
from typing import Type, Optional, Dict

from langchain_core.tools import ToolException
from pydantic.v1 import BaseModel, Field

from models.mongo import Tool
from tools.global_tools import GlobalBaseTool


class BuiltinToolArgsSchema(BaseModel):
    query: str = Field(description="search string to invoke tool with")


class BaseBuiltinTool(GlobalBaseTool):
    name: str
    description: str
    code: str
    function_name: str
    properties_dict: dict
    api_key: Optional[str] = None
    args_schema: Type[BaseModel] = BuiltinToolArgsSchema
    logger: logging.Logger = None
    parameters: Optional[Dict[str, str]] = {}

    @classmethod
    def factory(cls, tool: Tool, **kwargs):
        return cls(
            name=tool.name,
            description=tool.description,
            function_name=tool.data.name,
            code=tool.data.code,
            properties_dict=tool.data.parameters.properties if tool.data.parameters.properties else {},
            parameters=tool.parameters,
            verbose=True,
            handle_tool_error=True
        )

    def __init__(self, **kwargs):
        kwargs["logger"] = logging.getLogger(self.__class__.__name__)
        kwargs["logger"].setLevel(logging.DEBUG)
        super().__init__(**kwargs)

    @abstractmethod
    def run_tool(self, query: str) -> str:
        pass

    @staticmethod
    def extract_query_val(text):
        res = re.findall('["\']?(?:query|text)["\']?:\s*["\'](.+)["\']', text)
        return res[0] if res else text

    def _run(self, query: str) -> str:
        try:
            self.logger.debug(f"{self.__class__.__name__} received {query}")
            # TODO: should figure a better way to do this... ideally using LLM itself
            query_val = self.extract_query_val(query)
            self.logger.info(f"{self.__class__.__name__} search string = '{query_val}'")
            return self.run_tool(query_val)
        except ToolException as te:
            raise te
        except Exception as e:
            raise ToolException(f"An error occurred: {e}")

