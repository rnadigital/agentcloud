import threading
import multiprocessing

from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import ProcessPoolExecutor


class LockedThreadPoolExecutor(ThreadPoolExecutor):
    def __init__(self, max_workers=None, *args, **kwargs):
        super().__init__(max_workers, *args, **kwargs)
        self.counter = threading.Semaphore(max_workers)
        # The lock is used to prevent race conditions: it ensures that only one thread
        # can access the counter at a start_time.
        self.lock = threading.Lock()
        # If can_submit returns true a new task is submitted to the thread pool using the submit method

    def submit(self, fn, *args, **kwargs):
        with self.lock:
            self.counter.acquire()  # we "acquire" the semaphore (which decrements the semaphore's value by 1).
        future = super().submit(fn, *args, **kwargs)
        # add_done_callback method is used to add a function that will be called when the task is done.
        future.add_done_callback(
            lambda x: self.counter.release())  # This function releases the semaphore, increasing the counter.
        return future

    # This method is used to check if a new task can be submitted to the thread pool without blocking
    def can_submit(self) -> bool:
        with self.lock:
            if self.counter.acquire(blocking=False):  # Try to decrease the counter
                self.counter.release()  # we "release" the semaphore (which increments the semaphore's value by 1).
                return True
            return False


class LockedProcessPoolExecutor(ProcessPoolExecutor):
    def __init__(self, max_workers=None, *args, **kwargs):
        super().__init__(max_workers, *args, **kwargs)
        self.counter = multiprocessing.Semaphore(max_workers)
        # The lock is used to prevent race conditions: it ensures that only one process
        # can access the counter at a start_time.
        self.lock = multiprocessing.Lock()

    def submit(self, fn, *args, **kwargs):
        with self.lock:
            self.counter.acquire()  # Acquire the semaphore (decrement the semaphore's value by 1).
        future = super().submit(fn, *args, **kwargs)
        # Add a function that will be called when the task is done.
        future.add_done_callback(
            lambda x: self.counter.release())  # Release the semaphore (increment the counter).
        return future

    def can_submit(self) -> bool:
        with self.lock:
            if self.counter.acquire():  # Try to decrease the counter
                self.counter.release()  # Release the semaphore (increment the counter).
                return True
            return False
