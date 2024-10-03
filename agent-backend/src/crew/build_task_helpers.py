import copy
import json
import re
import uuid
from io import BytesIO
from typing import Dict, Set, Callable

from crewai.tasks import TaskOutput
from pydantic import BaseModel

from models.mongo import PyObjectId, Task, Tool, Session
from crew.exceptions import CrewAIBuilderException
from models.sockets import SocketEvents
from mongo.queries import MongoClientConnection
from storage import storage_provider
from utils.json_schema_to_pydantic import json_schema_to_pydantic
from utils.model_helper import search_subordinate_keys, keyset


def get_task_tools(task: Task, crew_tools: Dict[Set[PyObjectId], Tool]):
    task_tools_objs = dict()
    for task_tool_id in task.toolIds:
        task_tool_set = search_subordinate_keys(crew_tools, keyset(task_tool_id))
        if len(list(task_tool_set.values())) > 0:
            task_tool = list(task_tool_set.values())[0]  # Note: this dict/list always holds 1 item
            task_tools_objs[task_tool.name] = task_tool
    return task_tools_objs


def get_context_tasks(task: Task, crew_tasks: Dict[Set[PyObjectId], Task]):
    context_task_objs = []
    if task.context:
        for context_task_id in task.context:
            context_task = crew_tasks.get(keyset(context_task_id))
            if not context_task:
                raise CrewAIBuilderException(
                    f"Task with ID '{context_task_id}' not found in '{task.name}' context. "
                    f"(Is it ordered later in Crew tasks list?)")
            context_task_objs.append(context_task)
    return context_task_objs


def _upload_task_output(
        task: Task,
        session_id: str,
        mongo_client: MongoClientConnection,
        send_to_socket_fn: Callable,
        task_output: TaskOutput
):
    # Convert the output to bytes and create an in-memory buffer
    buffer = BytesIO()
    buffer.write(str(task_output).encode())
    buffer.seek(0)  # Rewind the buffer to the beginning

    # Upload the in-memory buffer directly to the storage provider
    storage_provider.upload_file_buffer(buffer, task.taskOutputFileName, session_id, is_public=False)

    # Insert the output metadata into MongoDB
    mongo_client.insert_model("taskoutputs", {
        "session_id": session_id,
        "task_id": task.id,
        "task_output_file_name": task.taskOutputFileName,
    })

    # Get the signed URL for downloading the file
    signed_url = storage_provider.get_signed_url(task.taskOutputFileName, session_id, is_public=False)

    # Send the notification to the sockets
    send_to_socket_fn(
        text=f"Task output file uploaded successfully. Click this link to download your file [{task.taskOutputFileName}]({signed_url})",
        event=SocketEvents.MESSAGE,
        chunk_id=str(uuid.uuid4())
    )


def _assign_structured_output_fields_to_variables(task_output: TaskOutput,
                                                  session: Session, mongo_client: MongoClientConnection, output_variables: list):
    
    matching_values = extract_matching_values(task_output.pydantic.model_dump(), output_variables)
    for key, value in matching_values.items():
        matching_values[key] = str(value) if not isinstance(value, str) else value

    if not hasattr(session, 'variables') or session.variables is None:
        session.variables = {}
    session.variables.update(matching_values)
    mongo_client.update_session_variables(session_id=session.id, variables=session.variables)


def _assign_output_to_variable_if_single_variable(
        task: Task, task_output: TaskOutput, session: Session, mongo_client: MongoClientConnection
):
    if task.taskOutputVariableName:
        if not hasattr(session, 'variables') or session.variables is None:
            session.variables = {}
        session_variables = session.variables.copy()
        session_variables[task.taskOutputVariableName] = str(task_output)
        mongo_client.update_session_variables(session_id=session.id, variables=session_variables)


def _update_variables_from_output(
        task: Task, task_output: TaskOutput, session: Session, mongo_client: MongoClientConnection, output_variables: list
):
    if task.isStructuredOutput:
        _assign_structured_output_fields_to_variables(task_output, session, mongo_client, output_variables)
    else:
        _assign_output_to_variable_if_single_variable(task, task_output, session, mongo_client)


# Factory to create the callback function so we dont overwrite it with the one from the last task
def make_task_callback(task: Task, session: Session, mongo_client: MongoClientConnection, send_to_socket_fn: Callable, output_variables: list ):
    def callback(task_output: TaskOutput):
        _update_variables_from_output(task, task_output, session, mongo_client, output_variables)
        if task.storeTaskOutput:
            _upload_task_output(task, session.id, mongo_client, send_to_socket_fn, task_output)

    return callback


def get_output_pydantic_model(task: Task):
    try:
        expected_output = json.loads(task.expectedOutput)
        if "variables" in expected_output:
            del expected_output["variables"]
        return json_schema_to_pydantic(expected_output)
    except Exception:
        pass

def get_output_variables(task: Task):
    try:
        schema = json.loads(task.expectedOutput)
        return schema.get("variables", [])
    except Exception:
        return []


def extract_matching_values(data: dict, output_vars: list) -> dict:
    matching_values = {}

    def extract(data: dict, output_vars: list):
        for key, value in data.items():
            if key in output_vars:
                matching_values[key] = value
            if isinstance(value, dict):
                extract(value, output_vars)

    extract(data, output_vars)
    return matching_values
