# Use the official Python image as the base image
FROM python:3.11 as builder

# Set the working directory inside the container
WORKDIR /app

# Set custom poetry env
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

# Install Poetry with a fixed version for reproducibility
RUN pip install poetry==1.8.2

# Copy only the files needed for installing dependencies
COPY pyproject.toml poetry.lock /app/

RUN cat pyproject.toml

# Install dependencies and remove cache dir after finished for smaller image
RUN poetry install --no-root && rm -rf $POETRY_CACHE_DIR

# TESTING: Uninstall poetry afterwards, no longer needed
#RUN pip uninstall poetry

# The runtime image, used to just run the code provided its virtual environment
FROM python:3.11-slim as runtime

WORKDIR /app

ARG LOG_LEVEL

ENV LOG_LEVEL=$LOG_LEVEL

ENV VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}

# Copy the rest of the application code into the container
COPY ./src/ /app/

# Expose port 8080 for the FastAPI application
EXPOSE 8080

# Command to run the FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
