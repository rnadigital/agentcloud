import logging
import random
import time
from agents.base import init_socket_generate_group, task_execution, new_rag_execution
from utils.log_exception_context_manager import log_exception
from bullmq import Worker, Job
from init.env_variables import REDIS_HOST, REDIS_PORT
import threading


async def process(job: Job, token: str):
    print(f'Running session ID: {job.data.get("sessionId")}')
    # Send job to the correct executor based on the job type
    match job.name:
        case "execute_task":
            thread = threading.Thread(target=execute_task, args=[job.data])
            thread.start()
        case "generate_team":
            thread = threading.Thread(target=execute_task, args=[job.data])
            thread.start()
        case "execute_rag":
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


def generate_team(data: dict):
    with log_exception():
        task = data.get("task")
        session_id = data.get("sessionId")
        init_socket_generate_group(task, session_id)  # Pass task to be executed


def execute_task(data: dict):
    with log_exception():
        task = data.get("task")
        session_id = data.get("sessionId")
        task_execution(task, session_id)


def execute_rag(data: dict):
    with log_exception():
        task = data.get("task")
        session_id = data.get("sessionId")
        new_rag_execution(task, session_id)
