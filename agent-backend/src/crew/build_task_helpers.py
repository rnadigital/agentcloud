import json
import uuid
from io import BytesIO
from typing import Dict, Set, Callable

from crewai.tasks import TaskOutput

from models.mongo import PyObjectId, Task, Tool
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


def _upload_task_output(task, session_id, mongo_client, send_to_socket_fn, task_output):
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


# Factory to create the callback function so we dont overwrite it with the one from the last task
def make_task_callback(task: Task, session_id: str, mongo_client: MongoClientConnection, send_to_socket_fn: Callable):
    def callback(task_output: TaskOutput):
        _upload_task_output(task, session_id, mongo_client, send_to_socket_fn, task_output)

    return callback if task.storeTaskOutput else None


def get_output_pydantic_model(task: Task):
    try:
        return json_schema_to_pydantic(json.loads(task.expectedOutput))
    except Exception:
        pass


def escape_curly_braces(text: str):
    return text.replace('{', '&lcub;').replace('}', '&rcub;')
