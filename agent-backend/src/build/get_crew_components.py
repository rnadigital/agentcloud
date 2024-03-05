import logging
from typing import Optional, List, Dict, Tuple, Set
from itertools import chain as flatten
from init.mongo_session import start_mongo_session
from models.mongo import Credentials, Datasource, Model, PyObjectId, Session, Task, Tool
from build.build_crew import CrewAIBuilder

# from init.env_variables import SOCKET_URL, BASE_PATH, AGENT_BACKEND_SOCKET_TOKEN


mongo_client = start_mongo_session()


def construct_crew(session_id: str, task: Optional[str]):
    # try:
        session: Session = mongo_client.get_session(session_id)
        print(f"Session: {session}")
        the_crew, crew_tasks, crew_agents = mongo_client.get_crew(session)
        print("Crew:", the_crew, crew_tasks, crew_agents)

        agents_tools: Dict[Set[PyObjectId], List[Tool]] = dict([
            (_keyset(agent.id), mongo_client.get_tools(agent.toolIds))
            for agent in crew_agents
        ]) if crew_agents else {}
        # agents_tools: List[Tuple] = [(agent["id"], mongo_client.get_models_by_ids("tools", Tool, agent.get("tool_ids"))) for agent in crew_agents] if crew_agents else []
        agents_tools_datasources: Dict[Set[PyObjectId], Datasource] = dict(flatten(*[ 
             [
                (agent_id_set.union(_keyset(tool_id)), datasource)
                for tool_id, datasource in mongo_client.get_tools_datasources(agent_tools)
            ] for _i, (agent_id_set, agent_tools) in enumerate(agents_tools.items())
        ]))
        # agent_tools_dataources_models = [(tool_id) for agent_id, datasource in agents_tools_dataources]
        agents_tasks: Dict[Set[PyObjectId], List[Task]] = dict([
            (_keyset(agent.id), mongo_client.get_agent_tasks(agent.taskIds))
            for agent in crew_agents
        ]) if crew_agents else {}
        agents_tasks_tools: Dict[Set[PyObjectId], Dict[PyObjectId, List[Tool]]] = dict(flatten(*[
            [
                (agent_id_set.union(_keyset(task.id)), mongo_client.get_tools(task.toolIds))
                for task in tasks
            ] for _i, (agent_id_set, tasks) in enumerate(agents_tasks.items())
        ])) if agents_tasks else {}
        tasks_tools_datasources: Dict[Set[PyObjectId], Datasource] = dict(flatten(*[
            [
                (task_id_set.union(_keyset(tool_id)), datasource)
                for tool_id, datasource in mongo_client.get_tools_datasources(tasks_tools)
            ]
            for _i, (task_id_set, tasks_tools) in enumerate(agents_tasks_tools.items())
        ]))
        agent_models: Dict[Set[PyObjectId], Model] = dict([
             (_keyset(agent.id), mongo_client.get_agent_model(agent.modelId))
            for agent in crew_agents
        ]) if crew_agents else {}
        agent_model_credentials: Dict[Set[PyObjectId], Credentials] = dict([
             (model_id_set.union(_keyset(model.id)), mongo_client.get_model_credential(model.credentialId))
             for _i, (model_id_set, model) in enumerate(agent_models.items())
        ]) if agent_models else {}
        chat_history: List[Dict] = mongo_client.get_chat_history(session_id)

        crew_builder = CrewAIBuilder(
            task,
            session_id,
            the_crew,
            crew_tasks,
            crew_agents,
            agent_tasks,
            agents_tools,
            agents_tools_datasources,
            agent_models,
            model_credentials,
            chat_history
        )
        crew = crew_builder.build_crew()
        crew_builder.run_crew(crew)
    # except Exception as e:
    #     logging.error(f"{e}")


def _keyset(*args):
    return frozenset(args)

if __name__ == "__main__":
    print("Running file")
