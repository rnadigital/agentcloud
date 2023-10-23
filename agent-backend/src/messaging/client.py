import logging

import socketio
from socketio.exceptions import ConnectionError
import time
from agents.base import init_socket_generate_team, task_execution
from concurrency.locked_threading import LockedThreadPoolExecutor
from init.env_variables import SOCKET_URL, MAX_THREADS
from utils.log_exception_context_manager import log_exception

sio = socketio.Client()
thread_pool = LockedThreadPoolExecutor(max_workers=MAX_THREADS)


# TODO: Handle reconnection if server goes down


@sio.event
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


@sio.event
def execute_task(data: dict):
    with log_exception():
        task = data.get("task")
        session_id = data.get("sessionId")
        with thread_pool as executor:
            while not thread_pool.can_submit():
                time.sleep(30)
            executor.submit(task_execution(task, session_id))


@sio.event
def connect():
    print('connection established')


def join_room(room_name: str):
    sio.emit("join_room", room_name)


@sio.event
def disconnect():
    print('disconnected from server')


@sio.event
def connect_error():
    print("The connection failed!")


# TODO: Need to handle retries
def init_socket():
    try:
        print(f"{SOCKET_URL}")
        sio.connect(f"{SOCKET_URL}")
        join_room("task_queue")
        sio.wait()
    except ConnectionError as ce:
        print("Hellooooo")
        logging.exception(ce)
        return None
    except Exception as e:
        logging.exception(e)
        return None
