import threading
import time

from messaging.client import consume_tasks
from init.env_variables import MAX_THREADS
from fastapi import FastAPI

app = FastAPI()


@app.on_event("startup")
async def startup_event():
    if threading.active_count() < MAX_THREADS:
        await consume_tasks()
    else:
        print("All threads are busy...will try again")
        time.sleep(10)
        await consume_tasks()
