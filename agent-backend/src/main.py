import logging
import signal
import threading
import time

from asyncio import CancelledError

from langchain.globals import set_debug, set_verbose

from messaging.client import consume_tasks
from init.env_variables import MAX_THREADS, LOG_LEVEL
from fastapi import FastAPI
from contextlib import asynccontextmanager

app_logger = logging.getLogger("app")

app_logger.setLevel(LOG_LEVEL.upper())

if app_logger.getEffectiveLevel() == logging.DEBUG:
    set_debug(True)
    set_verbose(True)


def sigint_handler(*args):
    raise SystemExit("Got SIGINT. Exiting...")


@asynccontextmanager
async def lifespan(app: FastAPI):
    signal.signal(signal.SIGINT, sigint_handler)

    print("running lifespan function")

    try:
        if threading.active_count() < MAX_THREADS:
            await consume_tasks()
        else:
            print("All threads are busy...will try again")
            time.sleep(10)
            await consume_tasks()
        yield
    except CancelledError:
        pass


app = FastAPI(lifespan=lifespan)

if __name__ == "__main__":
    print("hello world")
