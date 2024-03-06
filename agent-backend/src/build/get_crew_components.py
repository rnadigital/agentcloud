import logging
from typing import Optional, List, Dict, Set
from itertools import chain as flatten
from init.mongo_session import start_mongo_session
from models.mongo import Credentials, Datasource, Model, PyObjectId, Session, Task, Tool
from build.build_crew import CrewAIBuilder  # , CrewAIBuilder
from utils.model_helper import keyset

# from init.env_variables import SOCKET_URL, BASE_PATH, AGENT_BACKEND_SOCKET_TOKEN


mongo_client = start_mongo_session()


def construct_crew(session_id: str, task: Optional[str]):
    """Construct crew. Collate every element into dictionary by type.
    The key is a set of all the parent ids.
    This allows for a flat structure that distinguishes between agent tools and task tools,
    for example, or for another example, agent models from tool models...etc"""
    # try:
    session: Session = mongo_client.get_session(session_id)
    print(f"Session: {session}")
    
    the_crew, crew_tasks, crew_agents = mongo_client.get_crew(session)
    print("Crew:", the_crew, crew_tasks, crew_agents)

    # Agent > Tools
    agents_tools: Dict[Set[PyObjectId], List[Tool]] = dict([
        (keyset(agent.id), mongo_client.get_tools(agent.toolIds))  # (id, Tool)
        for agent in crew_agents  # [Agent]
    ]) if crew_agents else {}

    # Agent > Tools > Datasource
    agents_tools_datasources: Dict[Set[PyObjectId], Datasource] = dict(flatten(*[
        [
            (agent_id_set.union(keyset(tool_id)), datasource)  # (id, Datasource)
            for tool_id, datasource in mongo_client.get_tools_datasources(agent_tools)  # [(id, Datasource)]
        ] for _i, (agent_id_set, agent_tools) in enumerate(agents_tools.items())  # { id: Tool }
    ]))

    # Agent > Datasource > Model

    # Agent > Datasource > Model > Credentials

    # Agent > Task
    agents_tasks: Dict[Set[PyObjectId], List[Task]] = dict([
        (keyset(agent.id), mongo_client.get_agent_tasks(agent.taskIds))  # (id, Task)
        for agent in crew_agents  # [Agent]
    ]) if crew_agents else {}

    # Agent > Tasks > Tools
    agents_tasks_tools: Dict[Set[PyObjectId], List[Tool]] = dict(flatten(*[
        [
            (agent_id_set.union(keyset(task.id)), mongo_client.get_tools(task.toolIds))  # (id, Tool)
            for task in tasks  # [Task]
        ] for _i, (agent_id_set, tasks) in enumerate(agents_tasks.items())  # { id: Task }
    ])) if agents_tasks else {}

    # Agent > Tasks > Tools > Datasource
    tasks_tools_datasources: Dict[Set[PyObjectId], Datasource] = dict(flatten(*[
        [
            (task_id_set.union(keyset(tool_id)), datasource)  # (id, Datasource)
            for tool_id, datasource in mongo_client.get_tools_datasources(tasks_tools)  # [(id, Datasource)]
        ]
        for _i, (task_id_set, tasks_tools) in enumerate(agents_tasks_tools.items())  # { id: Tool }
    ]))

    # Agent > Tasks > Tools > Datasource > Model

    # Agent > Tasks > Tools > Datasource > Model > Credentials

    # Agent > Model
    agent_models: Dict[Set[PyObjectId], Model] = dict([
        (keyset(agent.id), mongo_client.get_agent_model(agent.modelId))  # (id, Model)
        for agent in crew_agents  # [Agent]
    ]) if crew_agents else {}

    # Agent > Model > Credential
    agent_model_credentials: Dict[Set[PyObjectId], Credentials] = dict([
        (model_id_set.union(keyset(model.id)), mongo_client.get_model_credential(model.credentialId))
        # (id, Credentials)
        for _i, (model_id_set, model) in enumerate(agent_models.items())  # { id, Model }
    ]) if agent_models else {}

    chat_history: List[Dict] = mongo_client.get_chat_history(session_id)

    # Flatten Agents Tasks so Dict[Set[str], List[Task]] becomes Dict[Set[str], Task]
    crew_agents_tasks_dict = dict(flatten(
        *[[(task_id_set.union(keyset(task.id)), task) for task in tasks] for _i, (task_id_set, tasks) in
          enumerate(agents_tasks.items())]))
    # Put Tasks is a dictionary with their Ids as key
    crew_tasks_dict = dict([(keyset(task.id), task) for task in crew_tasks])
    # Put Agents is a dictionary with their Ids as key
    crew_agents_dict = dict([(keyset(agent.id), agent) for agent in crew_agents])
    # Flatten agent's task's tools so Dict[Set[str], List[Tool]] becomes Dict[Set[str], Tool]
    crew_tools_dict = dict(flatten(
        *[[(tool_id_set.union(keyset(tool.id)), tool) for tool in tools] for _i, (tool_id_set, tools) in
          enumerate((agents_tools | agents_tasks_tools).items())]))

    crew_builder = CrewAIBuilder(
        session_id=session_id,
        crew=the_crew,
        agents=crew_agents_dict,
        tasks=crew_tasks_dict | crew_agents_tasks_dict,
        tools=crew_tools_dict,
        datasources=agents_tools_datasources | tasks_tools_datasources,
        models=agent_models,
        credentials=agent_model_credentials
    )
    crew_builder.build_crew()
    crew_builder.run_crew()


# except Exception as e:
#     logging.error(f"{e}")

if __name__ == "__main__":
    print("Running file")
