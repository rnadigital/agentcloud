import socketio
import time
from agents.base import init_socket_generate_team, task_execution
from concurrency.locked_threading import LockedThreadPoolExecutor
from init.env_variables import SOCKET_URL

sio = socketio.Client()
thread_pool = LockedThreadPoolExecutor(max_workers=50)


# TODO: Handle reconnection if server goes down


@sio.event
def generate_team(data: dict):
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


def init_socket():
    sio.connect(url=SOCKET_URL)
    join_room("task_queue")
    sio.wait()
