import logging
import os
from dotenv import load_dotenv
import google.auth
from gcp.cloud_secrets import access_secret

load_dotenv()

google_cloud_credentials_present = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

LOCAL = os.getenv("LOCAL", "True") == 'True'
if google_cloud_credentials_present and len(google_cloud_credentials_present) > 0:
    LOCAL = False
    credentials, PROJECT_ID = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )

# Get project ID and Local var from .env file
BASE_PATH = os.getenv("BASE_PATH", "./src") if LOCAL else "."
SOCKET_URL = os.getenv("SOCKET_URL", "http://webapp_next:3000/") if LOCAL else access_secret("SOCKET_URL")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "test") if LOCAL else access_secret("MONGO_DB_NAME")


def _set_max_threads() -> int:
    try:
        max_threads: int = int(os.getenv("MAX_THREADS", 50))
        return max_threads
    except ValueError:
        logging.warning("Max Threads could not be coerced to an integer. Falling back to default value of 50 workers")
        return 50


MAX_THREADS = _set_max_threads()
