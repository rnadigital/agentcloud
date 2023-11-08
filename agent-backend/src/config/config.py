import logging
import os.path

from init.env_variables import OPENAI_API_KEY, BASE_PATH
import json
from init.mongo_session import start_mongo_session


def update_openai_api_key():
    with open(f"{BASE_PATH}/config/OAI_CONFIG_LIST.json", 'r') as f:
        file = json.loads(f.read())
        api_key = file[0].get("api_key")
        if api_key:
            file[0]["api_key"] = OPENAI_API_KEY
            with open(f"{BASE_PATH}/config/OAI_CONFIG_LIST.json", 'w') as q:
                json.dump(file, q, indent=4)


# filename = f"tmp_code_{code_hash}.{'py' if lang.startswith('python') else lang}"
# if work_dir is None:
#     work_dir = WORKING_DIR
# filepath = os.path.join(work_dir, filename)
# file_dir = os.path.dirname(filepath)
# os.makedirs(file_dir, exist_ok=True)
# if code is not None:
#     with open(filepath, "w", encoding="utf-8") as fout:
#         fout.write(code)


def create_config_file_with_key_from_mongo(session_id: str, model: str = "gpt-4-32k", platform: str = "OPENAI"):
    try:
        mongo = start_mongo_session()
        tokens: [dict] = mongo.get_token(session_id)
        obj = dict()
        for token in tokens:
            token_platform = token.get("platform")
            match token_platform == platform:
                case True:
                    creds = token.get("credentials")
                    if creds:
                        key = creds.get("key")
                        obj["model"] = model
                        obj["api_key"] = key
                        break
                case _:
                    print("Not currently supported!")
        if len(obj) > 0:
            file_name = f"{BASE_PATH}/config/{session_id}.json"
            file_dir = os.path.dirname(file_name)
            os.makedirs(file_dir, exist_ok=True)
            with open(file_name, 'w') as file:
                json.dump([obj], file, indent=4)
            return True
        else:
            raise Exception("Failed to write config file!")
    except Exception as e:
        logging.exception(e)
        return False
