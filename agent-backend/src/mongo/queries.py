from typing import List, Optional

from utils.log_exception_context_manager import raise_exception, log_exception
from mongo.client import MongoConnection
from pymongo import collection, database
from bson.objectid import ObjectId


class MongoClientConnection(MongoConnection):

    def __init__(self):
        super().__init__()
        self.mongo_client = self.connect()
        self.db_name = "test"  # TODO:  Need to paramatrise this variable
        self.db = None
        self.collection = None

    @property
    def _get_db(self) -> database.Database:
        return self.mongo_client[self.db_name]

    @property
    def _get_auth_collection(self) -> collection.Collection:
        return self.db["auth"]

    @property
    def _get_chat_collection(self) -> collection.Collection:
        return self.db["chat"]

    @property
    def _get_sessions_collection(self) -> collection.Collection:
        return self.db["sessions"]

    def insert_refresh_token(self, customer_id: str, refresh_token: str) -> bool:
        with raise_exception():
            self.db = self._get_db
            self.collection = self._get_auth_collection
            self.collection.insert_one(
                {"customerId": customer_id, "refreshToken": refresh_token})
        return True

    def get_refresh_token(self, customer_id: str) -> Optional[str]:
        with raise_exception():
            self.db = self._get_db
            self.collection = self._get_auth_collection
            token = self.collection.findOne({"customerId": customer_id}, {"refreshToken": 1})
            print(token)
            return token

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
