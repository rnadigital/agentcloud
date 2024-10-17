from pymongo import MongoClient
import logging
from typing import Optional
from init.env_variables import DB_URL


class MongoConnection:
    def __init__(self):
        self.mongo_uri = DB_URL

    def connect(self) -> Optional[MongoClient]:
        try:
            mongo_client = MongoClient(self.mongo_uri, maxPoolSize=10)
            return mongo_client
        except Exception as e:
            logging.exception(e)
            return None
