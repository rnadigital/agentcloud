import logging
from typing import Optional, List, Dict

from init.mongo_session import start_mongo_session
from models.mongo import Session
from build.build_crew import CrewAIBuilder

# from init.env_variables import SOCKET_URL, BASE_PATH, AGENT_BACKEND_SOCKET_TOKEN


mongo_client = start_mongo_session()


def construct_crew(session_id: str, task: Optional[str]):
    try:
        session: Session = mongo_client.get_session(session_id)
        print(f"Session: {session}")
        the_crew, crew_tasks, crew_agents = mongo_client.get_crew(session)
        agent_tools: List[Dict] = [mongo_client.get_agent_tools(agent.get("toolIds")) for agent in crew_agents]
        agent_tasks: List[Dict] = [mongo_client.get_agent_tasks(agent.get("taskIds")) for agent in crew_agents]
        agent_models: List[Dict] = [mongo_client.get_agent_model(agent.get("modelId")) for agent in crew_agents]
        model_credentials: List[Dict] = [mongo_client.get_model_credentials(model.get("credentialId")) for model in
                                         agent_models]
        chat_history: List[Dict] = mongo_client.get_chat_history(session_id)

        crew_builder = CrewAIBuilder(
            task,
            session_id,
            the_crew,
            crew_tasks,
            crew_agents,
            agent_tasks,
            agent_tools,
            agent_models,
            model_credentials,
            chat_history
        )
        crew = crew_builder.build_crew()
        crew_builder.run_crew(crew)
    except Exception as e:
        logging.error(f"{e}")


if __name__ == "__main__":
    print("Running file")
