import logging
from contextlib import contextmanager


@contextmanager
def raise_exception():
    try:
        yield
    except Exception as err:
        logging.exception(err)
        raise


@contextmanager
def log_exception():
    try:
        yield
    except Exception as err:
        logging.exception(err)
