import logging

from mongo.client import MongoConnection
from pymongo import collection
from bson.objectid import ObjectId
from init.env_variables import MONGO_DB_NAME
from models.mongo import Agent, Credentials, Crew, Datasource, Model, Session, Task, Tool
from typing import List, Dict, Union, Any, Optional
from pydantic import BaseModel

from utils.model_helper import convert_dictionaries_to_models, get_models_attribute_values


class MongoClientConnection(MongoConnection):
    def __init__(self):
        super().__init__()
        self.mongo_client = self.connect()
        self.db = self.mongo_client[MONGO_DB_NAME]

    def _get_collection(self, collection_name: str) -> collection.Collection:
        return self.db[collection_name]

    def get_session(self, session_id: str) -> Session:
        try:
            session_query_results: Optional[Session] = self._get_collection(
                "sessions"
            ).find_one(
                {"_id": ObjectId(session_id)}, {"crewId": 1}
            )
            assert session_query_results
            return session_query_results
        except AssertionError as ae:
            logging.exception(f"Query returned NO sessions: {ae}")
        except Exception as e:
            logging.error(f"an error has occurred while retrieving session from the database: {e}")

    def get_crew(self, session: Session):
        try:
            crew_id = session.get("crewId")
            print(f"Crew ID: {crew_id}")
            crew_tasks = list()
            try:
                assert crew_id is not None
            except AssertionError:
                raise AssertionError(f"no Crew ID found for Session Id {session.get('id')}")
            crews_collection: collection.Collection = self._get_collection("crews")
            tasks_collection: collection.Collection = self._get_collection("tasks")
            agents_collection: collection.Collection = self._get_collection("agents")
            try:
                the_crew: Dict = crews_collection.find_one({"_id": ObjectId(crew_id)})
                assert the_crew
                crew_task_ids = the_crew.get("tasks")
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
            return (Crew(**the_crew), convert_dictionaries_to_models(crew_tasks, Task),
                    convert_dictionaries_to_models(crew_agents, Agent))
        except Exception:
            raise

    def get_tool_datasource(self, tool: Tool):
        return self.get_single_model_by_id("datasources", Datasource, tool.datasourceId)
        # return self.get_models_by_attributes("datasource", Datasource, tools, from_model_attribute="datasourceId", to_query_attribute="_id")
        # if tools is None:
        #     return []
        # else:
        # return [self._get_collection("datasources").find_one({"_id": convert_id_to_ObjectId(tool["datasourceId"])}) if ("datasourceId" in tool and tool["datasourceId"] is not None) else None for tool in tools]

    def get_tools(self, toolsIds: List[str]):
        return self.get_models_by_ids("tools", Tool, toolsIds)
        # if toolsIds is None:
        #     return []
        # else:
        #     return list(self._get_collection("tools").find(({"_id": {"$in": toolsIds}})))

    def get_agent_tasks(self, taskIds: List[str]):
        return self.get_models_by_ids("tasks", Task, taskIds)
        # if taskIds is None:
        #     return []
        # else:
        #     return [task for task in self._get_collection("tasks").find(({"_id": {"$in": taskIds}}))]

    def get_agent_model(self, modelId: str):
        return self.get_single_model_by_id("models", Model, modelId)
        # return self._get_collection("models").find_one(({"_id": modelIds}))

    def get_model_credential(self, credentialId: str):
        return self.get_single_model_by_id("credentials", Credentials, credentialId)
        # return self._get_collection("credentials").find_one(({"_id": credentialIds}))

    def get_agent_datasources(self, agent: Dict):
        pass

    ### OTHER
    def get_models_by_query(self, db_collection: str, model_class: type, query: Dict):
        """Takes a db collection name and a pydantic model and after calling query gets the retrned list of dictionary and converts to list of specified model"""
        return convert_dictionaries_to_models(self._get_collection(db_collection).find(query),
                                              model_class) if query else []

    def get_models_by_attributes(self, db_collection: str, model_class: type, query_models: List[BaseModel],
                                 from_model_attribute: str, to_query_attribute: str):
        """
        Takes a db collection name and a pydantic model. Also takes the list of models to query from, and what proerty of theirs to use as values in the search.
        Also takes the attribute in the db collection to search by (.e.g from_model_attribute is 'toolIds' and to_query_attribute is '_id').
        After calling query gets the retrned list of dictionary and converts to list of specified model"""
        return self.get_models_by_query(db_collection, model_class,
                                        {to_query_attribute: {
                                            "$in": get_models_attribute_values(from_model_attribute, query_models)
                                        }
                                        }) if (query_models and len(query_models) > 0) else []

    def get_models_by_ids(self, db_collection: str, model_class: type, ids: List[ObjectId] | List[str]):
        """Takes a db collection name and a pydantic model. Creates query where the '_id' is search by the list of ids provided.
        After calling query gets the retrned list of dictionary and converts to list of specified model"""
        if ids and len(ids) > 0:
            use_ids = list(map(convert_id_to_ObjectId, ids))
            return self.get_models_by_query(db_collection, model_class, {"_id": {"$in": use_ids}})
        else:
            return []

    def get_single_model_by_query(self, db_collection: str, model_class: type, query: Dict):
        """Takes a db collection name and a pydantic model and after calling query gets the retrned it returns a single model instance or None"""
        res = self._get_collection(db_collection).find_one(query)
        if res:
            return model_class(**res)
        else:
            return None

    def get_single_model_by_id(self, db_collection: str, model_class: type, id: ObjectId | str):
        """Takes a db collection name and a pydantic model and creates a query to compare the given id to the ids in the collection.
        After the query has retrned it returns a single model instance or None"""
        use_id = convert_id_to_ObjectId(id)
        return self.get_single_model_by_query(db_collection, model_class, {"_id": use_id})

    # TODO we need to store chat history in the correct format to align with LLM return
    def get_chat_history(
            self, session_id: str
    ) -> Optional[List[dict[str, Union[str, Any]]]]:
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


def convert_id_to_ObjectId(id):
    if type(id) == str:
        return ObjectId(id)
    else:
        return id
