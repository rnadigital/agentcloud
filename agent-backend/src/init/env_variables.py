import logging
import os
import threading

from dotenv import load_dotenv
import google.auth

load_dotenv()

google_cloud_credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

LOCAL = os.getenv("LOCAL", "True") == 'True'
if not LOCAL and google_cloud_credentials_path and len(google_cloud_credentials_path) > 0:
    if os.path.getsize(google_cloud_credentials_path) > 0:
        LOCAL = False
        credentials, PROJECT_ID = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )

# Get project ID and Local var from .env file
BASE_PATH = os.getenv("BASE_PATH", "./src") if LOCAL else "."
SOCKET_URL = os.getenv("SOCKET_URL", "http://webapp_next:3000/")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "test")
DB_URL = os.getenv("DB_URL")
MAX_RETRIES = os.getenv("MAX_RETRIES", 10)
REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = 6379


def _set_max_threads() -> int:
    try:
        initial_threads = threading.active_count()
        max_threads: int = int(os.getenv("MAX_THREADS", 50)) + initial_threads
        return max_threads
    except ValueError:
        logging.warning("Max Threads could not be coerced to an integer. Falling back to default value of 50 workers")
        return 50


MAX_THREADS = _set_max_threads()
