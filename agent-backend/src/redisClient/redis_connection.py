import logging
import redis
from init.env_variables import REDIS_HOST, REDIS_PORT


class RedisConnection:

    def __init__(self):
        self.redis_host = REDIS_HOST
        self.redis_port = REDIS_PORT

    def connect(self) -> redis:
        try:
            connection_pool = redis.ConnectionPool(host=self.redis_host, port=self.redis_port, db=0)
            connection = redis.Redis(connection_pool=connection_pool)
            return connection
        except Exception as e:
            logging.exception(e)
            return None
