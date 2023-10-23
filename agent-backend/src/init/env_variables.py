import os
from dotenv import load_dotenv
import google.auth
from gcp.cloud_secrets import access_secret
load_dotenv()
# Get project ID and Local var from .env file
LOCAL = os.getenv("LOCAL") == 'True'
MAX_THREADS = os.getenv("MAX_THREADS", 50)
BASE_PATH = os.getenv("BASE_PATH", "./src") if LOCAL else "."
SOCKET_URL = os.getenv("SOCKET_URL", "http://127.0.0.1:3000/") if LOCAL else access_secret("SOCKET_URL")

credentials, PROJECT_ID = google.auth.default(
    scopes=["https://www.googleapis.com/auth/cloud-platform"]
)

google_ads_scope = "https://www.googleapis.com/auth/adwords"

google_auth = {
    "developer_token": os.getenv("DEVELOPER_TOKEN") if LOCAL else access_secret("GOOGLE_DEVELOPER_TOKEN"),
    "client_id": os.getenv("CLIENT_ID") if LOCAL else access_secret("GOOGLE_CLIENT_ID"),
    "client_secret": os.getenv("CLIENT_SECRET") if LOCAL else access_secret("GOOGLE_CLIENT_SECRET"),
    "use_proto_plus": True,
    "refresh_token": "",
}
