import logging

from pymongo.cursor import Cursor

from mongo.client import MongoConnection
from pymongo import collection, database
from bson.objectid import ObjectId
from init.env_variables import MONGO_DB_NAME
from init.env_variables import BASE_PATH
from models.mongo import Credentials, Data, Tool, Agent, Model, Crew, Session, Task
from typing import List, Dict, Union, Any, Optional


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

    def get_session(self, session_id: str) -> Session:
        try:
            self.db = self._get_db
            sessions_collection: collection.Collection = self._get_collection(
                "sessions"
            )
            session_query_results = sessions_collection.find_one(
                {"_id": ObjectId(session_id)}, {"groupId": 1, "agentId": 1}
            )
            assert session_query_results
            return session_query_results
        except Exception as e:
            logging.error(f"an error has occurred while retrieving session from the database: {e}")

    def get_crew(self, session: Session):
        try:
            self.db = self._get_db
            crew_id = session.get("crewId")
            crew_tasks = list()
            try:
                assert crew_id is not None
            except AssertionError:
                raise AssertionError(f"no Crew ID found for Session Id {session.get('id')}")
            crews_collection: collection.Collection = self._get_collection("crews")
            tasks_collection: collection.Collection = self._get_collection("tasks")
            agents_collection: collection.Collection = self._get_collection("agents")
            try:
                the_crew: Crew = crews_collection.find_one({"_id": crew_id})
                assert the_crew
                crew_task_ids: List[Task] = the_crew.tasks
                if crew_task_ids and len(crew_task_ids) > 0:
                    crew_tasks = [tasks_collection.find_one({"_id": task}) for task in crew_task_ids]
            except AssertionError:
                raise AssertionError(f"Crew ID returned NO crews for ID: {crew_id}")
            try:
                crew_agent_ids = the_crew.get("agents")
                assert crew_agent_ids
                crew_agents = [agents_collection.find_one({"_id": agent}) for agent in crew_agent_ids]
            except AssertionError:
                raise AssertionError(f"There were no agents associated with the crew ID: {crew_id}")
            return the_crew, crew_tasks, crew_agents
        except Exception:
            raise

    def get_agent_tools(self, agent: Agent):
        return [tool for tool in self._get_collection("tools").find(({"_id": {"$in": agent.tools}}))]

    def get_agent_tasks(self, agent: Agent):
        return [task for task in self._get_collection("tasks").find(({"_id": {"$in": agent.tasks}}))]

    def get_agent_model(self, agent: Agent):
        return self._get_collection("models").find_one(({"_id": agent.llm}))

    def get_model_credentials(self, model: Model):
        return self._get_collection("credentials").find_one(({"_id": model.credentials}))

    def get_agent_datasources(self, agent: Agent):
        pass

    # TODO we need to store chat history in the correct format to align with LLM return
    def get_chat_history(
            self, session_id: str
    ) -> Optional[List[dict[str, Union[str, Any]]]]:
        self.db = self._get_db
        chat_collection: collection.Collection = self._get_collection("chat")
        chat_messages = chat_collection.find({"sessionId": ObjectId(session_id)})
        if chat_messages:
            messages = [
                {
                    "role": f"{'user' if m.get('message').get('incoming') else 'assistant'}",
                    "content": m.get("message").get("message").get("text"),
                }
                for m in chat_messages
            ]
            if messages and len(messages) > 0:
                return messages

        return []
