import threading
import time

from messaging.client import consume_tasks
from init.env_variables import MAX_THREADS
from fastapi import FastAPI
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("running lifespan function")
    if threading.active_count() < MAX_THREADS:
        await consume_tasks()
    else:
        print("All threads are busy...will try again")
        time.sleep(10)
        await consume_tasks()
    yield


app = FastAPI(lifespan=lifespan)

if __name__ == "__main__":
    print("hello world")
