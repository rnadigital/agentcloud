import logging

import redis

from gcp.cloud_secrets import access_secret
from init.env_variables import LOCAL


class RedisConnection:

    def __init__(self):
        self.redis_host = '127.0.0.1' if LOCAL else access_secret('redis_host')
        self.redis_port = 6379 if LOCAL else access_secret("redis_port")

    def connect(self) -> redis:
        try:
            connection_pool = redis.ConnectionPool(host=self.redis_host, port=self.redis_port, db=0)
            connection = redis.Redis(connection_pool=connection_pool)
            return connection
        except Exception as e:
            logging.exception(e)
            return None
