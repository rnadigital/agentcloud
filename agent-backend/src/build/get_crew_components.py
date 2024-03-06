import logging
from typing import Optional, List, Dict, Set, Tuple, Union
from itertools import chain as flatten
from init.mongo_session import start_mongo_session
from models.mongo import Agent, Credentials, Datasource, FastEmbedModelsDocFormat, FastEmbedModelsStandardFormat, Model, Platforms, PyObjectId, Session, Task, Tool
from build.build_crew import CrewAIBuilder  # , CrewAIBuilder
from utils.model_helper import get_enum_key_from_value, get_enum_value_from_str_key, in_enums, keyset

# from init.env_variables import SOCKET_URL, BASE_PATH, AGENT_BACKEND_SOCKET_TOKEN


mongo_client = start_mongo_session()

def construct_models(parents: List[Tuple[Set[str], Agent | Datasource]]):
    models: Dict[Set[PyObjectId], Model] = dict()
    for parent_id_set, parent in parents:
        model = mongo_client.get_agent_model(parent.modelId)
        models[keyset(parent_id_set, model.id)] = model
    return models

def construct_model_credentials(models: List[Tuple[Set[str], Model]]):
    credentials: Dict[Set[PyObjectId], Credentials] = dict()
    for model_id_set, model in models:
        if model.credentialId:
            credential = mongo_client.get_model_credential(model.credentialId)
            credentials[keyset(model_id_set, credential.id)] = credential
        elif in_enums(enums=[FastEmbedModelsStandardFormat], value=model.model_name):
            model.model_name = get_enum_value_from_str_key(FastEmbedModelsDocFormat, get_enum_key_from_value(FastEmbedModelsStandardFormat, model.model_name))
            credentials[keyset(model_id_set)] = Credentials(type=Platforms.FastEmbed)
        elif in_enums(enums=[FastEmbedModelsDocFormat], value=model.model_name):
            credentials[keyset(model_id_set)] = Credentials(type=Platforms.FastEmbed)
    return credentials

def construct_tools(parents: List[Tuple[Set[str], Agent | Tool]]):
    tools : Dict[Set[PyObjectId], Tool] = dict()
    for parent_id_set, parent in parents:
        parent_tools = mongo_client.get_tools(parent.toolIds)
        for tool in parent_tools:
            tools[keyset(parent_id_set, tool.id)] = tool
    return tools

def construct_tool_datasources(tools: List[Tuple[Set[str], Tool]]):
    datasources: Dict[Set[PyObjectId], Datasource] = dict()
    for tool_id_set, tool in tools:
        datasource = mongo_client.get_tool_datasource(tool)
        if datasource:
            datasources[keyset(tool_id_set, datasource.id)] = datasource
    return datasources

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


    # Put Agents in a dictionary with their Ids as key
    crew_agents_dict: Dict[Set[PyObjectId], Agent] = dict([(keyset(agent.id), agent) for agent in crew_agents])
    
    # Put Tasks in a dictionary with their Ids as key
    crew_tasks_dict: Dict[Set[PyObjectId], Task] = dict([(keyset(task.id), task) for task in crew_tasks])
    
    # Agent > Model
    agent_models: Dict[Set[PyObjectId], Model] = construct_models(crew_agents_dict.items())
        
    # Agent > Model > Credential
    agent_model_credentials = construct_model_credentials(agent_models.items())

    # Agent > Tools
    agents_tools = construct_tools(crew_agents_dict.items())

    # Agent > Tools > Datasource
    agents_tools_datasources = construct_tool_datasources(agents_tools.items())

    # Agent > Datasource > Model
    agents_tools_datasources_models: Dict[Set[PyObjectId], Model] = construct_models(agents_tools_datasources.items())

    # Agent > Datasource > Model > Credentials
    agents_tools_datasources_models_credentials: Dict[Set[PyObjectId], Credentials] = construct_model_credentials(agents_tools_datasources_models.items())

    # Agent > Task (not currently needed)

    # Agent > Tasks > Tools (not currently needed)
    
    # Agent > Tasks > Tools > Datasource (not currently needed)

    # Agent > Tasks > Tools > Datasource > Model (not currently needed)

    # Agent > Tasks > Tools > Datasource > Model > Credentials (not currently needed)
        
    chat_history: List[Dict] = mongo_client.get_chat_history(session_id)

    # Flatten Agents Tasks so Dict[Set[str], List[Task]] becomes Dict[Set[str], Task] (not currently needed)
        # crew_agents_tasks_dict = dict(flatten(
        #     *[[(task_id_set.union(keyset(task.id)), task) for task in tasks] for _i, (task_id_set, tasks) in
        #     enumerate(agents_tasks.items())]))
    

    crew_builder = CrewAIBuilder(
        session_id=session_id,
        crew=the_crew,
        agents=crew_agents_dict,
        tasks=crew_tasks_dict, #| crew_agents_tasks_dict,
        tools=agents_tools,
        datasources=agents_tools_datasources, #| tasks_tools_datasources,
        models=agent_models | agents_tools_datasources_models,
        credentials=agent_model_credentials | agents_tools_datasources_models_credentials
    )
    crew_builder.build_crew()
    crew_builder.run_crew()

    # except Exception as e:
    #     logging.error(f"{e}")

if __name__ == "__main__":
    print("Running file")
