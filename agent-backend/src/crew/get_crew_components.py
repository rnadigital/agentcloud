from typing import Any, Optional, List, Dict, Set, Tuple, Union

from crew.exceptions import CrewAIBuilderException
from init.mongo_session import start_mongo_session
from models.mongo import Agent, AppType, Crew, Datasource, Model, PyObjectId, Session, Task, Tool, App, Process
from crew.build_crew import CrewAIBuilder
from utils.model_helper import keyset

mongo_client = start_mongo_session()


def construct_models(parents: List[Tuple[Set[str], Agent | Datasource | Crew]]):
    models: Dict[Set[PyObjectId], Model] = dict()
    for parent_id_set, parent in parents:
        model = mongo_client.get_model(parent.modelId)
        if model is not None:
            models[keyset(parent_id_set, model.id)] = model
    return models


def construct_manager_model(model_id: PyObjectId) -> Dict:
    model = mongo_client.get_model(model_id)
    return {'manager_llm': model}


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
            if datasource.byoVectorDb is True:
                vector_db = mongo_client.get_vector_db(datasource.vectorDbId)
                datasource.vector_db = vector_db
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

    if not session:
        raise CrewAIBuilderException(f"Session with id '{session_id}' not found. Perhaps terminated by user?")

    app, the_crew, crew_tasks, crew_agents = mongo_client.get_crew(session)
    print("Mongo Crew Data:", app, the_crew, crew_tasks, crew_agents)

    # Put Agents in a dictionary with their Ids as key
    crew_agents_dict: Dict[Set[PyObjectId], Agent] = dict([(keyset(agent.id), agent) for agent in crew_agents])

    # Agent > Model
    agent_models: Dict[Set[PyObjectId], Model] = construct_models(crew_agents_dict.items())

    # Put Tasks in a dictionary with their Ids as key
    crew_tasks_dict: Dict[Set[PyObjectId], Task] = dict([(keyset(task.id), task) for task in crew_tasks])

    # Combine agent and task tools
    agents_tasks_tools = construct_tools(crew_agents_dict.items()) | construct_tools(crew_tasks_dict.items())

    # Agent > Tools > Datasource
    agents_tools_datasources = construct_tools_datasources(agents_tasks_tools.items())

    # Agent > Datasource > Model
    agents_tools_datasources_models: Dict[Set[PyObjectId], Model] = construct_models(agents_tools_datasources.items())

    # Inputs to pass to crew > kickoff()
    crew_input_variables = session.variables

    # Crew > Manager LLM
    crew_manager_llm = dict()
    if the_crew.process == Process.Hierarchical:
        if not the_crew.managerModelId:
            raise CrewAIBuilderException("Using hierarchical process but `manager_llm` not set")
        crew_manager_llm = construct_manager_model(the_crew.managerModelId)

    chat_history: List[Dict] = mongo_client.get_chat_history(session_id)

    crew_builder = CrewAIBuilder(
        session_id=session_id,
        session=session,
        socket=socket,
        app_type=app.appType,
        crew=the_crew,
        agents=crew_agents_dict,
        tasks=crew_tasks_dict,  # | crew_agents_tasks_dict,
        tools=agents_tasks_tools,
        datasources=agents_tools_datasources,  # | tasks_tools_datasources,
        models=agent_models | agents_tools_datasources_models | crew_manager_llm,
        input_variables=crew_input_variables,
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
