from init.env_variables import OPENAI_API_KEY, BASE_PATH
import json


def update_openai_api_key():
    with open(f"{BASE_PATH}/config/OAI_CONFIG_LIST.json", 'r') as f:
        file = json.loads(f.read())
        api_key = file[0].get("api_key")
        if api_key:
            file[0]["api_key"] = OPENAI_API_KEY
            with open(f"{BASE_PATH}/config/OAI_CONFIG_LIST.json", 'w') as q:
                json.dump(file, q, indent=4)
