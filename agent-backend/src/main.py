import threading
import time

from messaging.client import consume_tasks
from fastapi import FastAPI
# from config.config import update_openai_api_key

app = FastAPI()

# update_openai_api_key()


@app.on_event("startup")
async def startup_event():
    if threading.active_count() < MAX_THREADS:
        await consume_tasks()
    else:
        print("All threads are busy...will try again")
        time.sleep(10)
        await consume_tasks()
