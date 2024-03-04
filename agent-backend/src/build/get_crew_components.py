import logging
from typing import Optional, List, Dict, Tuple

from init.mongo_session import start_mongo_session
from models.mongo import Session
from build.build_crew import CrewAIBuilder

# from init.env_variables import SOCKET_URL, BASE_PATH, AGENT_BACKEND_SOCKET_TOKEN


mongo_client = start_mongo_session()


def construct_crew(session_id: str, task: Optional[str]):
    # try:
        session: Session = mongo_client.get_session(session_id)
        print(f"Session: {session}")
        the_crew, crew_tasks, crew_agents = mongo_client.get_crew(session)
        print("Crew:", the_crew, crew_tasks, crew_agents)
        agents_tools: List[Tuple] = [(agent["_id"], mongo_client.get_agent_tools(agent.get("toolIds"))) for agent in crew_agents] if crew_agents else []
        tools_datasources: List[Tuple] = [(agent_id, mongo_client.get_tool_datasources(agent_tools)) for (agent_id, agent_tools) in agents_tools]
        datasources_models: List[Tuple] = [(datasource.get("_id"), mongo_client.get_model(datasource.get("modelId"))) for _, datasource in tools_datasources] if crew_agents else []
        agent_tasks: List[Dict] = [mongo_client.get_agent_tasks(agent.get("taskIds")) for agent in crew_agents] if crew_agents else []
        agent_models: List[Dict] = [mongo_client.get_model(agent.get("modelId")) for agent in crew_agents] if crew_agents else []
        model_credentials: List[Dict] = [mongo_client.get_model_credentials(model.get("credentialId")) for model in agent_models] if agent_models else []
        chat_history: List[Dict] = mongo_client.get_chat_history(session_id)

        crew_builder = CrewAIBuilder(
            task,
            session_id,
            the_crew,
            crew_tasks,
            crew_agents,
            agent_tasks,
            agents_tools,
            tools_datasources,
            datasources_models,
            agent_models,
            model_credentials,
            chat_history
        )
        crew = crew_builder.build_crew()
        crew_builder.run_crew(crew)
    # except Exception as e:
    #     logging.error(f"{e}")


if __name__ == "__main__":
    print("Running file")
