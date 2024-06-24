import logging
import random
import time
from crew.get_crew_components import construct_crew, looping_app, session_terminated
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
        session_id = data.get("sessionId")
        socket = None
        loop_max = 20
        while True:
            crew_builder, app = construct_crew(session_id, socket)
            crew_builder.build_crew()
            crew_builder.run_crew()
            socket = crew_builder.socket
            loop_max = loop_max - 1
            if looping_app(app) == False or loop_max < 1 or session_terminated(session_id):
                break
