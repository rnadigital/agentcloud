from messaging.client import consume_tasks
from fastapi import FastAPI
from config.config import update_openai_api_key

app = FastAPI()

update_openai_api_key()


@app.on_event("startup")
async def startup_event():
    await consume_tasks()
