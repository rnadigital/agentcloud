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
        self.collection = None

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
            self.collection = self._get_chat_collection
            self.collection.insert_one({"_id": ObjectId(), "message": message})

    def get_token(self, session_id):
        with log_exception():
            self.db = self._get_db
            self.collection = self._get_sessions_collection
            session = self.collection.find_one({"_id": ObjectId(session_id)}, {"teamId": 1})
            if session:
                team_id = session.get("teamId")
                team = self._get_teams_collection.find_one({"_id": team_id}, {"tokens": 1})
                tokens = team.get("tokens")
                return tokens

    def get_team(self, session_id: str) -> dict:
        with log_exception():
            self.db = self._get_db
            self.collection = self._get_sessions_collection
            team = {
                "group_chat": True,
                "roles": []
            }
        list_of_agents = list()
        query_results = self.collection.find_one({"_id": ObjectId(session_id)}, {"agents": 1})
        agents = query_results.get("agents")
        for agent in agents:
            agent_id: ObjectId = agent.get("agentId")
            agent_data: dict = self._get_team_member(agent_id)
            list_of_agents.append(agent_data)
        team["roles"] = list_of_agents
        return team

    def _get_team_member(self, agent_id: ObjectId) -> dict:
        self.collection = self._get_agents_collection
        agent_data = dict()
        agent = self.collection.find_one({"_id": ObjectId(agent_id)})
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
