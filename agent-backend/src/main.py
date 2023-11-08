from messaging.client import init_socket
from fastapi import FastAPI
# from config.config import update_openai_api_key

app = FastAPI()

# update_openai_api_key()


@app.on_event("startup")
def startup_event():
    init_socket()
