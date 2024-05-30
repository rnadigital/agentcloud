import sys
from typing import Dict, Type
from langchain.tools import BaseTool
import json
import subprocess

from langchain_core.pydantic_v1 import create_model, Field
from .global_tools import GlobalBaseTool
from models.mongo import Tool

import requests
import os
import json
import google.oauth2.id_token
import google.auth.transport.requests

class GoogleCloudFunctionTool(GlobalBaseTool):
    """
    Code execution tool
    Args:
        function_name (str): Name of the function. Has to be a valid python name. This name is used to call the function.
        properties_dict (dict): dictionary of tool.data.parameters.properties { proeprty_name: { type: string | number | boolean, ... } }
                                this dict is used to create a dynamic pydantic model for "args_schema"
    """
    name: str = ""
    description: str = ""
    function_name: str
    properties_dict: Dict = None
    args_schema: Type = None
    function_id: str = None

    def post_init(self):
        self.args_schema = create_model(f"{self.function_name}_model", **self.convert_args_dict_to_type(self.properties_dict))


    @classmethod
    def factory(cls, tool: Tool, **kargs):
        google_cloud_function_tool = GoogleCloudFunctionTool(
            name=tool.name,
            description=tool.description,
            function_name=tool.data.name,
            code=tool.data.code,
            properties_dict=tool.data.parameters.properties if tool.data.parameters.properties else [],
            function_id=str(tool.id)
        )
        google_cloud_function_tool.post_init()
        return google_cloud_function_tool
    
    def convert_args_dict_to_type(self, args_schema: Dict):
        args_schema_pydantic = dict()
        for k, v in args_schema.items():
            args_schema_pydantic[k]=((str, None))
        return args_schema_pydantic
    
    def convert_str_args_to_correct_type(self, args):
        typed_args = dict()
        for k, v in args.items():
            prop = self.properties_dict[k]
            if prop:
                typed_args[k]=bool(v) if prop.type == "boolean" else (int(v) if prop.type == "integer" else str(v))
        return typed_args
    
    def _run(self, args_str: Dict):
        args = json.loads(args_str)
        typed_args = self.convert_str_args_to_correct_type(args)
        print(f"args: {args}")
        print(f"typed args: {typed_args}")
        try:
            credentials, project_id = google.auth.default()
            request = google.auth.transport.requests.Request()
            audience = f"https://us-central1-{project_id}.cloudfunctions.net/function-{self.function_id}"
            TOKEN = google.oauth2.id_token.fetch_id_token(request, audience)
            r = requests.post(
                audience,
                headers={'Authorization': f"Bearer {TOKEN}", "Content-Type": "application/json"},
                data=json.dumps(typed_args)
            )
            print(f"status code: {r.status_code}")
            print(f"response body: {r.text}")
            return r.text or "No data"
        except TimeoutError:
            return "No data returned because the function call timed out."
