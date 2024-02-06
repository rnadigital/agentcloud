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
from autogen.agentchat.contrib.llava_agent import LLaVAAgent, llava_call

from dotenv import load_dotenv

import base64

def image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    return encoded_string


if __name__ == '__main__':

    # LIMITATION for AgentCloud, a URI is expected. Tried using base64, it rejects it.
    # We need to host LLAVA locally, upload the image to a host in the local network, and then call LLAVA with the local URI.

    load_dotenv()
    
    llava_config_list = [
        {
            "model": "whatever, will be ignored for remote",  # The model name doesn't matter here right now.
            "api_key": os.getenv("REPLICATE_API_TOKEN"),  # Note that you have to setup the API key with os.environ["REPLICATE_API_TOKEN"]
            "base_url": "yorickvp/llava-13b:2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591",
        }
    ]

    

    # REPLICATE TEST
    output = replicate.run(
    "yorickvp/llava-13b:e272157381e2a3bf12df3a8edd1f38d1dbd736bbb7437277c8b34175f8fce358",
    input={
        "image": "https://raw.githubusercontent.com/microsoft/autogen/main/website/static/img/autogen_agentchat.png",
        "prompt": "Describe this AutoGen framework <img https://raw.githubusercontent.com/microsoft/autogen/main/website/static/img/autogen_agentchat.png> with bullet points."
    }

    )

    for item in output:
        # https://replicate.com/yorickvp/llava-13b/api#output-schema
        print(item, end="")
    
    


        
    # LLAVA CALL TEST
    rst = llava_call(
    "Describe this AutoGen framework <img https://raw.githubusercontent.com/microsoft/autogen/main/website/static/img/autogen_agentchat.png> with bullet points.",
    llm_config={"config_list": llava_config_list, "temperature": 0})

    print(rst)




    # Autogen Agents Test
    image_agent = LLaVAAgent(
    name="image-explainer",
    max_consecutive_auto_reply=10,
    llm_config={"config_list": llava_config_list, "temperature": 0.5, "max_new_tokens": 1000},
    )

    user_proxy = autogen.UserProxyAgent(
        name="User_proxy",
        system_message="A human admin.",
        code_execution_config={
            "last_n_messages": 3,
            "work_dir": "groupchat",
            "use_docker": False,
        },  # Please set use_docker=True if docker is available to run the generated code. Using docker is safer than running the generated code directly.
        human_input_mode="NEVER",  # Try between ALWAYS or NEVER
        max_consecutive_auto_reply=0)

    # Ask the question with an image
    user_proxy.initiate_chat(
        image_agent,
        message="""What's the breed of this dog?
    <img https://th.bing.com/th/id/OIP.qzZEo11GRIop4CpN19SD5QHaEo?rs=1&pid=ImgDetMain>.""")