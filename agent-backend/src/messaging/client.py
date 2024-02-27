import logging
import random
import time
from build.get_crew_components import construct_crew
from utils.log_exception_context_manager import log_exception
from bullmq import Worker, Job
from init.env_variables import REDIS_HOST, REDIS_PORT
import threading


async def process(job: Job, token: str):
    print(f'Running session ID: {job.data.get("sessionId")}')
    # Send job to the correct executor based on the job type
    thread = threading.Thread(target=execute_task, args=[job.data])
    thread.start()
    return True


async def consume_tasks():
    try:
        print("Listening to task queue..")
        Worker(
            "task_queue", process,
            {"connection": f"redis://{REDIS_HOST}:{REDIS_PORT}"}
        )
    except Exception as e:
        logging.exception(e)


def backoff(attempt, base_delay=1.0, max_delay=60):
    delay = min(max_delay, (base_delay * 2 ** attempt))
    time.sleep(delay + random.uniform(0, 0.2 * delay))


def execute_task(data: dict):
    with log_exception():
        task = data.get("task")
        session_id = data.get("sessionId")
        construct_crew(session_id, task)
