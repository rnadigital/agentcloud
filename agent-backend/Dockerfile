# Use the official Python image as the base image
FROM python:3.11-slim AS base

# Set the working directory inside the container
WORKDIR /app

# Install Poetry with a fixed version for reproducibility
RUN curl -sSL https://install.python-poetry.org | POETRY_VERSION=1.1.11 python3 - && \
    pip install poetry
# Disabling virtualenv and install dependencies globally
RUN poetry config virtualenvs.create false

# Copy only the files needed for installing dependencies
COPY pyproject.toml poetry.lock /app/

# Install project dependencies
RUN poetry install --no-root

# Use a second stage to keep the image lean
FROM base AS final

# Copy the rest of the application code into the container
COPY ./src/ /app/

# Add the google application credentials
ARG GOOGLE_KEYPATH
COPY $GOOGLE_KEYPATH /app/keyfile.json
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/keyfile.json

# Expose port 8080 for the FastAPI application
EXPOSE 8080

# Command to run the FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
