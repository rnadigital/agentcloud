import logging
import random

import socketio
from socketio.exceptions import ConnectionError
import time
from agents.base import init_socket_generate_team, task_execution
from concurrency.locked_threading import LockedThreadPoolExecutor
from init.env_variables import SOCKET_URL, MAX_THREADS, MAX_RETRIES
from utils.log_exception_context_manager import log_exception

sio = socketio.Client()
thread_pool = LockedThreadPoolExecutor(max_workers=MAX_THREADS)


def backoff(attempt, base_delay=1.0, max_delay=60):
    delay = min(max_delay, (base_delay * 2 ** attempt))
    time.sleep(delay + random.uniform(0, 0.2 * delay))


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


def join_room(room_name: str):
    sio.emit("join_room", room_name)


@sio.event
def connect():
    print('Connection to server established!')


@sio.event
def disconnect():
    print('Disconnected from server')
    sio.disconnect()  # Explicitly disconnecting
    sio.connected = False  # Explicitly set connected to False
    init_socket()  # Try to reconnect


@sio.event
def connect_error():
    print('Connection failed!')
    sio.disconnect()  # Explicitly disconnecting
    sio.connected = False  # Explicitly set connected to False
    init_socket()  # Try to reconnect


def init_socket():
    retries = 0
    while retries < int(MAX_RETRIES):
        try:
            if not sio.connected:  # Check if already connected
                print(f"Attempting Connection to {SOCKET_URL}...")
                sio.connect(SOCKET_URL)
            join_room("task_queue")
            sio.wait()
            break  # If successful, break the retry loop
        except (ConnectionError, socketio.exceptions.ConnectionError):
            print("Connection failed.")
            sio.disconnect()
            backoff(retries)  # Apply the exponential backoff
            retries += 1  # increment retires
        except TypeError:
            print("Connection failed.")
            sio.disconnect()
            backoff(retries)  # Apply the exponential backoff
            retries += 1  # increment retires
        except Exception as e:
            logging.exception(e)
            return None
    else:
        print("Reached max retries. Server not responding. Shutting down...")
        return None
