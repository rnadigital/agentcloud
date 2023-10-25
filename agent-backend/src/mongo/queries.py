from utils.log_exception_context_manager import log_exception
from mongo.client import MongoConnection
from pymongo import collection, database
from bson.objectid import ObjectId
from init.env_variables import MONGO_DB_NAME
from random import randint


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

    def insert_chat_messages(self, message: str):
        with log_exception():
            self.db = self._get_db
            self.collection = self._get_chat_collection
            self.collection.insert_one({"_id": ObjectId(), "message": message})

    def get_team(self, session_id: str) -> dict:
        with log_exception():
            self.db = self._get_db
            self.collection = self._get_sessions_collection
            team = {
                "group_chat": True,
                "gpt4_config": {
                    "seed": randint(1, 1000),
                    "temperature": 0,
                    "request_timeout": 300,
                    "retry_wait_time": 60
                },
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
            agent_data["name"] = agent.get("name")
            agent_data["type"] = agent.get("type", "AssistantAgent")
            agent_data["llm_config"] = agent.get("llmConfig", "gpt4_config")
            code_execution = agent.get("codeExecutionConfig")
            agent_data["code_execution_config"] = False if code_execution is None else {
                "last_n_messages": code_execution.get("lastNMessages", 3), "work_dir": code_execution.get("workDirectory", "output"),
                "use_docker": False}
            agent_data["system_message"] = agent.get("systemMessage", "You are an AI assistant")
            agent_data["human_input_mode"] = agent.get("humanInputMode", "NEVER")
            agent_data["is_user_proxy"] = agent.get("isUserProxy", False)
        return agent_data
