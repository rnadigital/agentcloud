from pymongo import MongoClient
from init.env_variables import LOCAL
from gcp.cloud_secrets import access_secret
import logging
from typing import Optional


class MongoConnection:
    def __init__(self):
        self.mongo_uri = 'mongodb://localhost:27017' if LOCAL else access_secret('RAPTOR_APP_MONGO_URL', 'latest')
        print(self.mongo_uri)

    def connect(self) -> Optional[MongoClient]:
        try:
            mongo_client = MongoClient(self.mongo_uri)
            return mongo_client
        except Exception as e:
            logging.exception(e)
            return None
