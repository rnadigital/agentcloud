from init.env_variables import BASE_PATH
import json

qdrant_retrieval_config = None


def get_qdrant_retrieval_config():
    global qdrant_retrieval_config
    if qdrant_retrieval_config is None:
        with open(f"{BASE_PATH}/agents/qdrant_retrieval/qdrant_retrieval_config.json", "r") as f:
            qdrant_retrieval_config = json.loads(f.read())
    return qdrant_retrieval_config


def map_fastembed_query_model_name(name: str):
    print(get_qdrant_retrieval_config()["fastembed_model_mapping"], "name", name)
    return get_qdrant_retrieval_config()["fastembed_model_mapping"][name]
