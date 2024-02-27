import logging
from typing import Optional
from init.mongo_session import start_mongo_session
from models.mongo import Session, Crew
from init.env_variables import SOCKET_URL, BASE_PATH, AGENT_BACKEND_SOCKET_TOKEN
from socketio.exceptions import DisconnectedError
from build.build_crew import CrewBuilder

mongo_client = start_mongo_session()


def construct_crew(session_id: str, task: Optional[str]):
    session: Session = mongo_client.get_session(session_id)
    the_crew, crew_tasks, crew_agents = mongo_client.get_crew(session)
    agent_tools = [mongo_client.get_agent_tools(agent.tools) for agent in crew_agents]
    agent_tasks = [mongo_client.get_agent_tools(agent.tools) for agent in crew_agents]
    agent_models = [mongo_client.get_agent_model(agent.llm) for agent in crew_agents]
    model_credentials = [mongo_client.get_model_credentials(model) for model in agent_models]
    chat_history = mongo_client.get_chat_history(session_id)

    crew_builder = CrewBuilder(
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

    crew_builder.build_crew()
    crew_builder.run_crew()


if __name__ == "__main__":
    print("Running file")
