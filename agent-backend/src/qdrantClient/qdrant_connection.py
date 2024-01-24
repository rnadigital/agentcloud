import autogen
from autogen.agentchat.contrib.qdrant_retrieve_user_proxy_agent import (
    QdrantRetrieveUserProxyAgent,
)
from autogen.agentchat.contrib.retrieve_assistant_agent import RetrieveAssistantAgent

# Accepted file formats for that can be stored in
# a vector database instance
from autogen.retrieve_utils import TEXT_FORMATS
import qdrantClient.qdrant_connection as qdc
import utils.class_checker as cch


from typing import List, Optional, Union, Any, Type, Dict
from pydantic import BaseModel, constr, conint, conlist, validator
from qdrant_client import QdrantClient
from autogen.agentchat import Agent


def get_connection(host: str, port: int) -> QdrantClient:
    # Check inputs
    class QdrantConnection(BaseModel):
        host: constr(min_length=2)
        port: conint(gt=0)  # Port number should be greater than 0

    # Validate and create connection
    connection = QdrantConnection(host=host, port=port)

    # Connect to Qdrant
    client = QdrantClient(host=connection.host, port=connection.port)

    try:
        # Request a list of collections from Qdrant
        collections = client.get_collections()
        print("Successfully connected to Qdrant. Collections:", collections)
    except Exception as e:
        # Handle exceptions (e.g., connection errors)
        print(f"Failed to connect to Qdrant: {e}")

    return client


def populate_collection(
    client: QdrantClient, collection_name: str, docs_path: Union[str, List[str]]
) -> Dict[str, Agent]:
    # collection_name = "devcollection_barack_obama"
    # docs_path = "https://en.wikipedia.org/wiki/Barack_Obama"
    # client = qdc.get_connection(host="localhost", port=6333)

    # Check inputs
    class Params(BaseModel):
        client: Any  # Checked QdrantClient below
        collection_name: constr(min_length=1)
        docs_path: Union[str, List[str]]

        @validator("client")
        def check_client(cls, v):
            return cch.check_instance_of_class(v, QdrantClient)

    params = Params(client=client, collection_name=collection_name, docs_path=docs_path)

    config_list = autogen.config_list_from_json(
        # env_or_file="/home/joshuak/Github/rnadigital/agentcloud/agent-backend/src/OAI_CONFIG_LIST",
        env_or_file="./OAI_CONFIG_LIST",
        filter_dict={
            "model": {
                "gpt-4",
            }
        },
    )

    assert len(config_list) > 0

    print("models to use: ", [config_list[i]["model"] for i in range(len(config_list))])

    # 1. create an RetrieveAssistantAgent instance named "assistant"
    llm_assistant_agent = RetrieveAssistantAgent(
        name="llmAssistantAgent",
        system_message="You are a helpful assistant.",
        llm_config={
            "timeout": 600,
            "cache_seed": 42,
            "config_list": config_list,
        },
    )

    # 2. create the QdrantRetrieveUserProxyAgent instance named "ragproxyagent"
    qdrant_retrieve_user_proxy_agent = QdrantRetrieveUserProxyAgent(
        name="qdrantRetrieveUserProxyAgent",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=10,
        retrieve_config={
            "task": "code",
            "collection_name": params.collection_name,
            "docs_path": params.docs_path,
            "chunk_token_size": 2000,
            "model": config_list[0]["model"],
            "client": params.client,
            "embedding_model": "BAAI/bge-small-en-v1.5",
        },
    )

    agents_dict = {
        "llm_assistant_agent": llm_assistant_agent,
        "qdrant_retrieve_user_proxy_agent": qdrant_retrieve_user_proxy_agent,
    }

    return agents_dict
