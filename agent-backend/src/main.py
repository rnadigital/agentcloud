from messaging.client import init_socket, consume_tasks
from fastapi import FastAPI
from config.config import update_openai_api_key
import asyncio

app = FastAPI()

update_openai_api_key()


@app.on_event("startup")
def startup_event():
    init_socket()
    asyncio.run(consume_tasks())
