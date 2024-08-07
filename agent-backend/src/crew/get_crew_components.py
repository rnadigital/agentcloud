from typing import Any, Optional, List, Dict, Set, Tuple, Union
from init.mongo_session import start_mongo_session
from models.mongo import Agent, AppType, Credentials, Crew, Datasource, FastEmbedModelsDocFormat, FastEmbedModelsStandardFormat, Model, \
    Platforms, PyObjectId, Session, Task, Tool, App
from crew.build_crew import CrewAIBuilder
from utils.model_helper import in_enums, keyset

mongo_client = start_mongo_session()


def construct_models(parents: List[Tuple[Set[str], Agent | Datasource | Crew]]):
    models: Dict[Set[PyObjectId], Model] = dict()
    for parent_id_set, parent in parents:
        model = mongo_client.get_agent_model(parent.modelId)
        if model is not None:
            models[keyset(parent_id_set, model.id)] = model
    return models


def construct_model_credentials(models: List[Tuple[Set[str], Model]]):
    credentials: Dict[Set[PyObjectId], Credentials] = dict()
    for model_id_set, model in models:
        if model.config:
            credential = model.config
            credentials[keyset(model_id_set, model.id if credential else None)] = credential
        elif in_enums(enums=[FastEmbedModelsStandardFormat, FastEmbedModelsDocFormat], value=model.model_name):
            credentials[keyset(model_id_set)] = Credentials(type=Platforms.FastEmbed)
    return credentials


def construct_tools(parents: List[Tuple[Set[str], Agent | Tool]]):
    tools: Dict[Set[PyObjectId], Tool] = dict()
    for parent_id_set, parent in parents:
        parent_tools = mongo_client.get_tools(parent.toolIds)
        for tool in parent_tools:
            tools[keyset(parent_id_set, tool.id)] = tool
    return tools


def construct_tools_datasources(tools: List[Tuple[Set[str], Tool]]):
    datasources: Dict[Set[PyObjectId], Datasource] = dict()
    for tool_id_set, tool in tools:
        datasource = mongo_client.get_tool_datasource(tool)
        if datasource:
            datasources[keyset(tool_id_set, datasource.id)] = datasource
    return datasources


def construct_crew(session_id: str, socket: Any):
    """Construct crew. Collate every element into dictionary by type.
    The key is a set of all the parent ids.
    This allows for a flat structure that distinguishes between agent tools and task tools,
    for example, or for another example, agent models from tool models...etc"""
    # try:
    session: Session = mongo_client.get_session(session_id)
    print(f"Session: {session}")

    app, the_crew, crew_tasks, crew_agents = mongo_client.get_crew(session)
    print("Crew:", app, the_crew, crew_tasks, crew_agents)

    # Put Agents in a dictionary with their Ids as key
    crew_agents_dict: Dict[Set[PyObjectId], Agent] = dict([(keyset(agent.id), agent) for agent in crew_agents])

    # Agent > Model
    agent_models: Dict[Set[PyObjectId], Model] = construct_models(crew_agents_dict.items())

    # Agent > Model > Credential
    agent_model_credentials = construct_model_credentials(agent_models.items())

    # Put Tasks in a dictionary with their Ids as key
    crew_tasks_dict: Dict[Set[PyObjectId], Task] = dict([(keyset(task.id), task) for task in crew_tasks])

    # Combine agent and task tools
    agents_tasks_tools = construct_tools(crew_agents_dict.items()) | construct_tools(crew_tasks_dict.items())

    # Agent > Tools > Datasource
    agents_tools_datasources = construct_tools_datasources(agents_tasks_tools.items())

    # Agent > Datasource > Model
    agents_tools_datasources_models: Dict[Set[PyObjectId], Model] = construct_models(agents_tools_datasources.items())

    # Agent > Datasource > Model > Credentials
    agents_tools_datasources_models_credentials: Dict[Set[PyObjectId], Credentials] = construct_model_credentials(
        agents_tools_datasources_models.items())

    # Crew > chat Model
    crew_chat_models: Dict[Set[PyObjectId], Model] = construct_models([(the_crew.id, the_crew)])

    # Crew > chat Model > Credentials
    crew_chat_models_credentials: Dict[Set[PyObjectId], Credentials] = construct_model_credentials(crew_chat_models.items())

    chat_history: List[Dict] = mongo_client.get_chat_history(session_id)

    crew_builder = CrewAIBuilder(
        session_id=session_id,
        socket=socket,
        app_type=app.appType,
        crew=the_crew,
        agents=crew_agents_dict,
        tasks=crew_tasks_dict,  # | crew_agents_tasks_dict,
        tools=agents_tasks_tools,
        datasources=agents_tools_datasources,  # | tasks_tools_datasources,
        models=agent_models | agents_tools_datasources_models | crew_chat_models,
        credentials=agent_model_credentials | agents_tools_datasources_models_credentials | crew_chat_models_credentials,
        chat_history=chat_history
    )
    return crew_builder, app

def looping_app(app: App):
    return app.appType == AppType.CHAT

def session_terminated(session_id: str):
    session = mongo_client.get_session(session_id)
    if session:
        return "status" in session and session["status"] == "terminated"
    return False
if __name__ == "__main__":
    print("Running file")
