from utils.log_exception_context_manager import log_exception
from mongo.client import MongoConnection
from pymongo import collection, database
from bson.objectid import ObjectId
from init.env_variables import MONGO_DB_NAME
from random import randint
from init.env_variables import BASE_PATH


class MongoClientConnection(MongoConnection):

    def __init__(self):
        super().__init__()
        self.mongo_client = self.connect()
        self.db_name = MONGO_DB_NAME
        self.db = None

    @property
    def _get_db(self) -> database.Database:
        return self.mongo_client[self.db_name]

    @property
    def _get_chat_collection(self) -> collection.Collection:
        return self.db["chat"]

    @property
    def _get_sessions_collection(self) -> collection.Collection:
        return self.db["sessions"]

    @property
    def _get_groups_collection(self) -> collection.Collection:
        return self.db["sessions"]

    @property
    def _get_agents_collection(self) -> collection.Collection:
        return self.db["agents"]

    @property
    def _get_teams_collection(self) -> collection.Collection:
        return self.db["teams"]

    @property
    def _get_credentials_collection(self) -> collection.Collection:
        return self.db["credentials"]

    def insert_chat_messages(self, message: str):
        with log_exception():
            self.db = self._get_db
            collection = self._get_chat_collection
            collection.insert_one({"_id": ObjectId(), "message": message})

    def get_token(self, session_id):
        with log_exception():
            self.db = self._get_db
            collection = self._get_sessions_collection
            session = collection.find_one({"_id": ObjectId(session_id)}, {"teamId": 1})
            if session:
                team_id = session.get("teamId")
                team = self._get_teams_collection.find_one({"_id": team_id}, {"tokens": 1})
                tokens = team.get("tokens")
                return tokens

    def get_group(self, session_id: str) -> dict:
        with log_exception():
            self.db = self._get_db
            collection = self._get_sessions_collection
            team = {
                "group_chat": True,
                "roles": []
            }
            list_of_agents = list()
            found_session = collection.find_one({"_id": ObjectId(session_id)}, {"groupId": 1})
            if found_session is None:
                raise Exception(f"session not found for session _id {session_id}")
            session_group_id = query_results.get("groupId")
            if session_group_id is None:
                raise Exception(f"groupId {session_group_id}")
            print(session_group_id)
            collection = 
            found_group = self._get_groups_collection.find_one({"_id": session_group_id})
            if found_group is None:
                raise Exception(f"group not found from session groupId {session_group_id}")
            admin_agent: dict = self._get_group_member(found_group.get("adminAgent"))
            list_of_agents.append(admin_agent)
            for agent_id in found_group.get("agents"):
                other_agent: dict = self._get_group_member(agent_id)
                list_of_agents.append(other_agent)
            team["roles"] = list_of_agents
            return team

    def _get_group_member(self, agent_id: ObjectId) -> dict:
        collection = self._get_agents_collection
        agent_data = dict()
        agent = collection.find_one({"_id": ObjectId(agent_id)})
        if agent is not None:
            credential_id = agent.get("credentialId")
            credential_obj = self._get_credentials_collection.find_one({"_id": credential_id},
                                                                       {"platform": 1, "credentials": 1})
            if credential_obj is not None and len(credential_obj) > 0:
                creds = credential_obj.get("credentials")
                platform = credential_obj.get("platform")
                match platform:
                    case "open_ai":
                        agent_data["key"] = creds.get("key")
                    case "azure":
                        agent_data["key"] = creds.get("key")
                    case _:
                        print("DO NOT SUPPORT!")
                agent_data["platform"] = platform
            agent_data["name"] = agent.get("name")
            agent_data["type"] = agent.get("type", "AssistantAgent")
            agent_data["model"] = agent.get("model", "gpt-4-32k")
            code_execution = agent.get("codeExecutionConfig")
            if code_execution:
                last_n_messages = code_execution.get("lastNMessages", 3)
                agent_data["code_execution_config"] = {
                    "last_n_messages": last_n_messages if last_n_messages is not None else 3,
                    "work_dir": f"{BASE_PATH}/{code_execution.get('workDirectory', 'output')}",
                    "use_docker": "python:3"
                }
            else:
                agent_data["code_execution_config"] = False
            agent_data["system_message"] = agent.get("systemMessage", "You are an AI assistant")
            agent_data["human_input_mode"] = agent.get("humanInputMode", "NEVER")
            agent_data["is_user_proxy"] = agent.get("isUserProxy", False)
        return agent_data
