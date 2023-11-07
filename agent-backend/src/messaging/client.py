import logging
import random
import socketio
import time
from agents.base import init_socket_generate_team, task_execution
from concurrency.locked_threading import LockedThreadPoolExecutor
from init.env_variables import MAX_THREADS
from utils.log_exception_context_manager import log_exception
from bullmq import Worker, Job
from init.env_variables import REDIS_HOST, REDIS_PORT
from asyncio import Future

sio = socketio.Client()
thread_pool = LockedThreadPoolExecutor(max_workers=MAX_THREADS)


async def consume_tasks():
    try:
        print("Listening to task queue..")

        async def process(job: Job, token: str):
            print(f"Running task for session: {token}...")
            # Send job to the correct executor based on the job type
            match job.name:
                case "execute_task":
                    execute_task(job.data)
                case "generate_team":
                    generate_team(job.data)
            return True

        worker = Worker(
            "task_queue",
            process,
            {"connection": f"redis://{REDIS_HOST}:{REDIS_PORT}"}
        )
        processing = Future()
        worker.on("completed", lambda job, result: processing.set_result(None))
        await processing
    except Exception as e:
        logging.exception(e)


def backoff(attempt, base_delay=1.0, max_delay=60):
    delay = min(max_delay, (base_delay * 2 ** attempt))
    time.sleep(delay + random.uniform(0, 0.2 * delay))


def generate_team(data: dict):
    with log_exception():
        task = data.get("task")
        session_id = data.get("sessionId")
        with thread_pool as executor:
            while not thread_pool.can_submit():
                time.sleep(5)  # Sleep for while if the thread pool is full
            # Submit the job to the executor
            executor.submit(
                init_socket_generate_team(task, session_id))  # Pass task to be executed


def execute_task(data: dict):
    with log_exception():
        task = data.get("task")
        session_id = data.get("sessionId")
        with thread_pool as executor:
            while not thread_pool.can_submit():
                time.sleep(30)
            executor.submit(task_execution(task, session_id))
