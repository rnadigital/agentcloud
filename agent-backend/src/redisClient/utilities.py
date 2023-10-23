import logging
import traceback
import json

from redisClient.redis_connection import RedisConnection
from utils.log_exception_context_manager import log_exception


class RedisClass(RedisConnection):
    def __init__(self):
        super().__init__()
        self.redis_client = self.connect()

    def insert_oauth_state(self, state: dict) -> bool:
        with log_exception():
            self.redis_client.set(state.get("customer_id"), json.dumps(state))
            return True

    def get_oauth_state(self, state):
        try:
            self.redis_client.get(state.get("customer_id"))
            return True
        except Exception as e:
            logging.exception(e)
            return False

    def check_hash_exists(self, hash_key: str) -> bool:
        """
        Checks if a Redis hash with the given key exists.

        Args:
            hash_key (str): The key of the Redis hash to check.

        Returns:
            bool: True if the Redis hash exists, False otherwise.

        """
        try:
            redis_rule = self.redis_client.hlen(
                hash_key)
            if redis_rule:
                return True
            else:
                return False
        except Exception as e:
            logging.exception(e.args[0])
            logging.exception(traceback.format_exc())
            return False

    def insert_hash(self, hash_key: str, key: str, data: list) -> bool:
        """
        Inserts a list of data into a Redis hash.

        Args:
            hash_key (str): The key of the Redis hash to insert data into.
            key (str): The key of the data within the Redis hash.
            data (list): The data to insert into the Redis hash.

        Returns:
            bool: True if the data was inserted successfully, False otherwise.

        """
        try:
            print(f"Updating Redis DataLayer Rules for Container: '{hash_key}'")
            self.redis_client.hset(
                hash_key,
                key, json.dumps(data))
            return True
        except Exception as err:
            logging.exception(err.args[0])
            logging.exception(traceback.format_exc())
            return False


if __name__ == '__main__':
    print(f"Running {__name__}")
