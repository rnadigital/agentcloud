from utils.log_exception_context_manager import log_exception
from mongo.client import MongoConnection
from pymongo import collection, database
from bson.objectid import ObjectId
from init.env_variables import MONGO_DB_NAME


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

    def insert_chat_messages(self, message: str):
        with log_exception():
            self.db = self._get_db
            self.collection = self._get_chat_collection
            self.collection.insert_one({"_id": ObjectId(), "message": message})

    def get_team(self, session_id: str):
        with log_exception():
            self.db = self._get_db
            self.collection = self._get_sessions_collection
            team = self.collection.find_one({"_id": ObjectId(session_id)}, {"team": 1})
            if team:
                return team.get("team")
            else:
                return None
