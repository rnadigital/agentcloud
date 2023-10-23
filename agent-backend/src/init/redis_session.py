from redisClient.redis_connection import RedisConnection
import redis


def start_redis_connection() -> redis:
    return RedisConnection().connect()
