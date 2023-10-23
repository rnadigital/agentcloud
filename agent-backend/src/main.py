from messaging.client import init_socket
from fastapi import FastAPI

app = FastAPI()


@app.on_event("startup")
def startup_event():
    init_socket()
