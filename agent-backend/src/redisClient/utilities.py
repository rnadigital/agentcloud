import logging
import traceback
import json

from redisClient.redis_connection import RedisConnection


class RedisClass(RedisConnection):
    def __init__(self):
        super().__init__()
        self.redis_client = self.connect()

    def check_hash_exists(self, hash_key: str) -> bool:
        """
        Checks if a Redis hash with the given key exists.

        Args:
            hash_key (str): The key of the Redis hash to check.

        Returns:
            bool: True if the Redis hash exists, False otherwise.

        """
        try:
            redis_rule = self.redis_client.hlen(hash_key)
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
            self.redis_client.hset(hash_key, key, json.dumps(data))
            return True
        except Exception as err:
            logging.exception(err.args[0])
            logging.exception(traceback.format_exc())
            return False


    def get(self, key: str) -> str:
        """
        Retrieves the value of a Redis key.

        Args:
            key (str): The key to retrieve the value for.

        Returns:
            str: The value of the key as a string, or None if the key does not exist.
        """
        try:
            value = self.redis_client.get(key)
            if value is not None:
                return value.decode('utf-8')
            else:
                return None
        except Exception as err:
            logging.exception(err.args[0])
            logging.exception(traceback.format_exc())
            return None

if __name__ == "__main__":
    print(f"Running {__name__}")
