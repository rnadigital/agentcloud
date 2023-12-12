import logging

from utils.log_exception_context_manager import log_exception
from mongo.client import MongoConnection
from pymongo import collection, database
from bson.objectid import ObjectId
from init.env_variables import MONGO_DB_NAME
from init.env_variables import BASE_PATH
from models.config_models import ToolData, AgentData, AgentConfig, LLMConfig, ConfigList
from typing import List, Dict, Union


class MongoClientConnection(MongoConnection):

    def __init__(self):
        super().__init__()
        self.mongo_client = self.connect()
        self.db_name = MONGO_DB_NAME
        self.db = None

    @property
    def _get_db(self) -> database.Database:
        return self.mongo_client[self.db_name]

    def _get_collection(self, collection_name: str) -> collection.Collection:
        return self.db[collection_name]

    def get_session(self, session_id: str) -> Dict:
        with log_exception():
            self.db = self._get_db
            sessions_collection: collection.Collection = self._get_collection("sessions")
            session_query_results = sessions_collection.find_one({"_id": ObjectId(session_id)},
                                                                 {"groupId": 1, "agentId": 1})
            if session_query_results is None:
                raise Exception(f"session not found for session _id {session_id}")
            return session_query_results

    def get_group(self, session: dict) -> Dict:
        with log_exception():
            self.db = self._get_db
            team = {
                "roles": []
            }
            list_of_agents = list()
            group_id = session.get("groupId")
            agent_id = session.get("agentId")
            if group_id is None and agent_id is None:
                raise Exception(f"no groupId or agentId found on session id {session.get('id')}")
            agents = list()
            if agent_id:
                agents.append(agent_id)
            elif group_id:
                groups_collection: collection.Collection = self._get_collection("groups")
                group_query_results = groups_collection.find_one({"_id": group_id})
                if group_query_results is None:
                    raise Exception(f"group not found from session groupId {group_id}")
                team["group_chat"] = group_query_results.get("groupChat")
                agents = group_query_results.get("agents")
                admin_agent = group_query_results.get("adminAgent")
                agents.append(admin_agent)
            if agents and len(agents) > 0:
                for agent in agents:
                    agent_data: Union[AgentData, None] = self._get_group_member(agent)
                    if agent_data:
                        agent_data.is_admin = True if (group_id and agent == admin_agent) else False
                        list_of_agents.append(agent_data.model_dump())
            team["roles"] = list_of_agents
            return team

    def _get_group_member(self, agent_id: ObjectId) -> Union[AgentData, None]:
        try:
            _collection: collection.Collection = self._get_collection("agents")
            agent = _collection.find_one({"_id": ObjectId(agent_id)})
            _config_list: ConfigList = ConfigList()
            # Get agent credentials
            if agent is not None:
                credential_id = agent.get("credentialId")
                credential_obj = self._get_collection("credentials").find_one(
                    {"_id": credential_id},
                    {"platform": 1, "credentials": 1})
                if credential_obj is not None and len(credential_obj) > 0:
                    creds = credential_obj.get("credentials")
                    # Construct Agent Config List
                    _config_list = ConfigList(
                        api_key=creds.get("key"),
                        api_type=credential_obj.get("platform"),
                        model=agent.get("model")
                    )

                # Construct LLMConfig
                tool_ids: List[ObjectId] = agent.get("toolIds")
                list_of_agent_tools: List[ToolData] = list()
                if tool_ids and len(tool_ids) > 0:
                    for tool_id in tool_ids:
                        tool = self._get_collection("tools").find_one(
                            {"_id": tool_id},
                            {"teamId": 0, "orgId": 0, "_id": 0})
                        if tool and len(tool) > 0:
                            agent_tool = ToolData(**tool.get("data"))
                            list_of_agent_tools.append(agent_tool)

                _llm_config = LLMConfig(
                    functions=list_of_agent_tools,
                    config_list=[_config_list]
                )
                # Construct Agent Config
                code_execution = agent.get("codeExecutionConfig")
                if code_execution and len(code_execution) > 0:
                    last_n_messages = code_execution.get("lastNMessages", 3)
                    code_execution_config = {
                        "last_n_messages": last_n_messages if last_n_messages is not None else 3,
                        "work_dir": f"{BASE_PATH}/{code_execution.get('workDirectory', 'output')}",
                        "use_docker": "python:3"
                    }
                else:
                    code_execution_config = {}
                _agent_config = AgentConfig(
                    name=agent.get("name"),
                    system_message=agent.get("systemMessage"),
                    human_input_mode=agent.get("humanInputMode") or "NEVER",
                    llm_config=_llm_config,
                    code_execution_config=code_execution_config
                )

                # Construct Agent Data
                _agent_data = AgentData(
                    type=agent.get("type", "AssistantAgent"),
                    data=_agent_config
                )
                return _agent_data
            else:
                return None
        except Exception as e:
            logging.exception(e)

    # TODO we need to store chat history in the correct format to align with LLM return
    def get_chat_history(self, session_id: str) -> List[str]:
        chat_collection: collection.Collection = self._get_collection("chat")
        chat_messages = chat_collection.find({"sessionId": ObjectId(session_id)})
        messages = [m.get("message").get("message").get("text") for m in chat_messages if chat_messages is not None]
        if messages and len(messages) > 0:
            return messages
