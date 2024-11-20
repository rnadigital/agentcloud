import json
import logging

from mongo.client import MongoConnection
from pymongo import collection
from bson.objectid import ObjectId
from init.env_variables import MONGO_DB_NAME
from models.mongo import (
    Agent,
    App,
    Crew,
    Datasource,
    Model,
    PyObjectId,
    Session,
    Task,
    Tool,
    Variable,
    VectorDb,
)
from typing import List, Dict, Union, Any, Optional
from pydantic import BaseModel

from utils.model_helper import (
    convert_dictionaries_to_models,
    get_models_attribute_values,
)


class MongoClientConnection(MongoConnection):
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(MongoClientConnection, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, "initialized"):
            super().__init__()
            self.mongo_client = self.connect()
            self.db = self.mongo_client[MONGO_DB_NAME]
            self.initialized = True

    def disconnect(self):
        print("Disconnecting from MongoDB")
        self.mongo_client.close()
        self.initialized = None  # Reset initialized status

    def _get_collection(self, collection_name: str) -> collection.Collection:
        return self.db[collection_name]

    def get_session(self, session_id: str) -> Session:
        try:
            session_query_results: Optional[Session] = self._get_collection(
                "sessions"
            ).find_one(
                {"_id": ObjectId(session_id)}, {"_id": 1, "appId": 1, "variables": 1}
            )
            assert session_query_results
            return Session(**session_query_results)
        except AssertionError as ae:
            logging.exception(f"Query returned NO sessions: {ae}")
        except Exception as e:
            logging.error(
                f"an error has occurred while retrieving session from the database: {e}"
            )

    def get_crew(self, session: Session) -> tuple[App, Crew, list, list]:
        try:
            app_id = session.appId
            print(f"App ID: {app_id}")
            apps_collection: collection.Collection = self._get_collection("apps")
            the_app: Dict = apps_collection.find_one({"_id": ObjectId(app_id)})
            crew_id = the_app.get("crewId")
            crew_tasks = list()
            try:
                assert crew_id is not None
            except AssertionError:
                raise AssertionError(f"no Crew ID found for Session Id {session.id}")
            crews_collection: collection.Collection = self._get_collection("crews")
            tasks_collection: collection.Collection = self._get_collection("tasks")
            agents_collection: collection.Collection = self._get_collection("agents")
            try:
                the_crew: Dict = crews_collection.find_one({"_id": ObjectId(crew_id)})
                assert the_crew
                crew_task_ids = the_crew.get("tasks")
                if crew_task_ids and len(crew_task_ids) > 0:
                    crew_tasks = [
                        tasks_collection.find_one({"_id": task})
                        for task in crew_task_ids
                    ]
            except AssertionError:
                raise AssertionError(f"Crew ID returned NO crews for ID: {crew_id}")
            try:
                crew_agent_ids = the_crew.get("agents")
                # assert crew_agent_ids
                crew_agents = [
                    agents_collection.find_one({"_id": agent})
                    for agent in crew_agent_ids
                ]
            except AssertionError:
                raise AssertionError(
                    f"There were no agents associated with the crew ID: {crew_id}"
                )
            try:
                app: App = self.get_app_by_crew_id(crew_id)
                assert app
            except AssertionError:
                raise AssertionError(
                    f"There were no apps associated with the crew: {crew_id}"
                )

            return (
                app,
                Crew(**the_crew),
                convert_dictionaries_to_models(crew_tasks, Task),
                convert_dictionaries_to_models(crew_agents, Agent),
            )
        except Exception:
            raise

    def get_tool_datasource(self, tool: Tool):
        return self.get_single_model_by_id("datasources", Datasource, tool.datasourceId)

    def get_tools(self, toolsIds: List[str]):
        return self.get_models_by_ids("tools", Tool, toolsIds)

    def get_tool(self, toolsId: str):
        return self.get_single_model_by_id("tools", Tool, toolsId)

    def get_vector_db(self, vectorDbId: str):
        return self.get_single_model_by_id("vectordbs", VectorDb, vectorDbId)

    def get_vector_dbs(self, vectorDbIds: List[str]):
        return self.get_models_by_ids("vectordbs", VectorDb, vectorDbIds)

    def get_agent_tasks(self, taskIds: List[str]):
        return self.get_models_by_ids("tasks", Task, taskIds)

    def get_model(self, modelId: str):
        return self.get_single_model_by_id("models", Model, modelId)

    def get_agent_datasources(self, agent: Dict):
        pass

    def get_app_variables(self, variable_ids: List[Union[str, PyObjectId]]):
        return self.get_models_by_ids("variables", Variable, variable_ids)

    def get_app_by_crew_id(self, crewId: PyObjectId):
        return self.get_single_model_by_query("apps", App, {"crewId": crewId})

    def get_models_by_query(self, db_collection: str, model_class: type, query: Dict):
        """Takes a db collection name and a pydantic model and after calling query gets the retrned list of dictionary and converts to list of specified model"""
        return (
            convert_dictionaries_to_models(
                self._get_collection(db_collection).find(query), model_class
            )
            if query
            else []
        )

    def get_models_by_attributes(
        self,
        db_collection: str,
        model_class: type,
        query_models: List[BaseModel],
        from_model_attribute: str,
        to_query_attribute: str,
    ):
        """
        Takes a db collection name and a pydantic model. Also takes the list of models to query from, and what proerty of theirs to use as values in the search.
        Also takes the attribute in the db collection to search by (.e.g from_model_attribute is 'toolIds' and to_query_attribute is '_id').
        After calling query gets the retrned list of dictionary and converts to list of specified model
        """
        return (
            self.get_models_by_query(
                db_collection,
                model_class,
                {
                    to_query_attribute: {
                        "$in": get_models_attribute_values(
                            from_model_attribute, query_models
                        )
                    }
                },
            )
            if (query_models and len(query_models) > 0)
            else []
        )

    def get_models_by_ids(
        self, db_collection: str, model_class: type, ids: List[ObjectId] | List[str]
    ):
        """Takes a db collection name and a pydantic model. Creates query where the '_id' is search by the list of ids provided.
        After calling query gets the retrned list of dictionary and converts to list of specified model
        """
        if ids and len(ids) > 0:
            use_ids = list(map(convert_id_to_ObjectId, ids))
            return self.get_models_by_query(
                db_collection, model_class, {"_id": {"$in": use_ids}}
            )
        else:
            return []

    def get_single_model_by_query(
        self, db_collection: str, model_class: type, query: Dict
    ):
        """Takes a db collection name and a pydantic model and after calling query gets the retrned it returns a single model instance or None"""
        res = self._get_collection(db_collection).find_one(query)
        if res:
            return model_class(**res)
        else:
            return None

    def get_single_model_by_id(
        self, db_collection: str, model_class: type, id: ObjectId | str
    ):
        """Takes a db collection name and a pydantic model and creates a query to compare the given id to the ids in the collection.
        After the query has retrned it returns a single model instance or None"""
        use_id = convert_id_to_ObjectId(id)
        return self.get_single_model_by_query(
            db_collection, model_class, {"_id": use_id}
        )

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

    def insert_model(
        self, db_collection: str, model_instance: BaseModel
    ) -> Optional[ObjectId]:
        collection = self._get_collection(db_collection)
        try:
            if isinstance(model_instance, dict):
                result = collection.insert_one(model_instance)
            else:
                result = collection.insert_one(model_instance.model_dump(by_alias=True))
            return result.inserted_id
        except Exception as e:
            logging.exception(f"Failed to insert model into {db_collection}: {e}")
            return None

    def update_session_variables(self, session_id: str, variables: dict) -> None:
        self._get_collection("sessions").update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {f"variables.{key}": value for key, value in variables.items()}},
        )


def convert_id_to_ObjectId(id):
    if type(id) == str:
        return ObjectId(id)
    else:
        return id
