import json
import os
import random
import time
from typing import Any, Callable, Dict, List, Optional, Tuple, Type, Union

import requests
from PIL import Image
from termcolor import colored

import autogen
import replicate

from autogen import Agent, AssistantAgent, ConversableAgent, UserProxyAgent
from autogen.agentchat.contrib.web_surfer import WebSurferAgent

from dotenv import load_dotenv

if __name__ == '__main__':

    # Not working

    load_dotenv()
    bing_api_key = os.environ["BING_API_KEY"]
    

    llm_config = {
    "config_list": autogen.config_list_from_json(
        "OAI_CONFIG_LIST",
        filter_dict={"model": ["gpt-4", "gpt-4-0613", "gpt-4-32k", "gpt-4-32k-0613", "gpt-4-1106-preview"]},
    ),
    "temperature": 0,
    }

    summarizer_llm_config = {
        "config_list": autogen.config_list_from_json(
            "OAI_CONFIG_LIST",
            filter_dict={"model": ["gpt-4", "gpt-3.5-turbo-16k-0613", "gpt-3.5-turbo-16k"]},
        ),
        "temperature": 0,
    }


    web_surfer = WebSurferAgent(
        "web_surfer",
        llm_config=llm_config,
        summarizer_llm_config=summarizer_llm_config,
        browser_config={"viewport_size": 4096, "bing_api_key": bing_api_key},
    )

    user_proxy = autogen.UserProxyAgent(
        "user_proxy",
        human_input_mode="NEVER",
        code_execution_config=False,
        default_auto_reply="",
        is_termination_msg=lambda x: True,
    )


    task1 = """
    Search the web for information about Microsoft AutoGen
    """

    user_proxy.initiate_chat(web_surfer, message=task1)