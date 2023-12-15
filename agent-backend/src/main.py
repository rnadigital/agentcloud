import threading
import time
from typing import Union

from pydantic import BaseModel

from messaging.client import consume_tasks
from init.env_variables import MAX_THREADS
from fastapi import FastAPI, responses
from models.canopy_server import ChatRequest
from agents.base import rag_execution

app = FastAPI()


@app.on_event("startup")
async def startup_event():
    if threading.active_count() < MAX_THREADS:
        await consume_tasks()
    else:
        print("All threads are busy...will try again")
        time.sleep(10)
        await consume_tasks()


class RagRequest(BaseModel):
    model: str
    message: str
    user: str
    stream: bool


@app.post("/v1/rag")
async def rag_execution(req: RagRequest) -> responses.JSONResponse:
    try:
        res = rag_execution(req.model, req.message, req.user, req.stream)
        return responses.JSONResponse(content=res, status_code=200)
    except Exception as e:
        return responses.JSONResponse(content=e, status_code=500)
