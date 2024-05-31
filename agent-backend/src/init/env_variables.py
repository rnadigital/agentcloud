import logging
import os
import threading

from dotenv import load_dotenv

load_dotenv()

LOCAL = os.getenv("LOCAL", "True") == "True"

# Get project ID and Local var from .env file
BASE_PATH = os.getenv("BASE_PATH", "./src") if LOCAL else "."
SOCKET_URL = os.getenv("SOCKET_URL", "http://webapp_next:3000/")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "test")
AGENT_BACKEND_SOCKET_TOKEN = os.getenv("AGENT_BACKEND_SOCKET_TOKEN")
DB_URL = os.getenv("DB_URL")
MAX_RETRIES = os.getenv("MAX_RETRIES", 10)
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = 6379
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
GOOGLE_FUNCTION_LOCATION = os.getenv("GOOGLE_FUNCTION_LOCATION", "us-central1")

def _set_max_threads() -> int:
    try:
        initial_threads = threading.active_count()
        max_threads: int = int(os.getenv("MAX_THREADS", 50)) + initial_threads
        return max_threads
    except ValueError:
        logging.warning(
            "Max Threads could not be coerced to an integer. Falling back to default value of 50 workers"
        )
        return 50


MAX_THREADS = _set_max_threads()
