from bson import ObjectId
from pymongo import MongoClient


def add_agent(agent_dict: dict) -> None:
    """
    Add an agent to the mongo database.
    """
    assert isinstance(agent_dict, dict), "agent_dict must be a dictionary."

    cnxn = MongoClient()
    mongo_client = cnxn["test"]

    # Upload input_json to mongo
    mongo_client["agents"].insert_one(agent_dict)
    # Disconnect from mongo
    cnxn.close()


def recreate_for_35(agent_dict: dict) -> None:
    assert isinstance(agent_dict, dict), "agent_dict must be a dictionary."

    # Pop id, recreate for 3.5
    agent_dict.pop("_id", None)
    agent_dict["name"] = agent_dict["name"] + "3.5"
    agent_dict["model"] = "gpt-3.5-turbo"
    add_agent(agent_dict=agent_dict)


def reset_default_agents() -> None:
    """
    Delete agents present and reset the mongo database with default agents.
    """
    cnxn = MongoClient()
    mongo_client = cnxn["test"]

    # Get default credentials id
    default_credential = mongo_client["credentials"].find_one(
        {"name": "OpenAI-agentcloud"}
    )
    default_credential_id = str(default_credential["_id"])

    # Delete all existing agents
    mongo_client["agents"].delete_many({})

    # Get all org and team id combinations as a list of tuples (org_id, team_id)
    # 1 org can have multiple teams in teamIds
    # Extract the org id and team id from each org into strings
    org_team_ids = []
    for org in mongo_client["orgs"].find():
        org_id = str(org["_id"])
        for team_id in org["teamIds"]:
            org_team_ids.append((org_id, str(team_id)))

    # Iterate and print all org and team id seperated by a space
    for org_team_id in org_team_ids:
        org_id = org_team_id[0]
        team_id = org_team_id[1]

        # User proxy agent
        user_proxy_dict = {
            "orgId": ObjectId(org_id),
            "teamId": ObjectId(team_id),
            "name": "user_proxy",
            "type": "UserProxyAgent",
            "codeExecutionConfig": None,
            "systemMessage": "A user proxy agent that executes code.",
            "humanInputMode": "NEVER",
            "model": "gpt-4",
            "credentialId": ObjectId(default_credential_id),
            "toolIds": [],
            "datasourceIds": [],
        }

        add_agent(agent_dict=user_proxy_dict)
        recreate_for_35(agent_dict=user_proxy_dict)

        # General agent
        general_agent_dict = {
            "_id": ObjectId("65b8297d1c6b30efe9d750a0"),
            "orgId": ObjectId(org_id),
            "teamId": ObjectId(team_id),
            "name": "general_assistant",
            "type": "AssistantAgent",
            "codeExecutionConfig": None,
            "systemMessage": "You are a general assistant.",
            "humanInputMode": None,
            "model": "gpt-4",
            "credentialId": ObjectId("65b829521c6b30efe9d7509f"),
            "toolIds": [],
            "datasourceIds": [],
        }

        add_agent(agent_dict=general_agent_dict)
        recreate_for_35(agent_dict=general_agent_dict)

        # Primary agent
        generate_images_id = str(
            mongo_client["tools"].find_one({"name": "Generate images"})["_id"]
        )
        find_papers_arxiv_id = str(
            mongo_client["tools"].find_one({"name": "Find papers on arXiv"})["_id"]
        )

        assert (
            len(generate_images_id) * len(find_papers_arxiv_id) != 0
        ), "Generate images or Find papers on arXiv tool not found."

        primary_assistant_dict = {
            "orgId": ObjectId(org_id),
            "teamId": ObjectId(team_id),
            "name": "primary_assistant",
            "type": "AssistantAgent",
            "codeExecutionConfig": None,
            "systemMessage": "You are a helpful assistant that can use available functions when needed to solve problems. At each point, do your best to determine if the user's request has been addressed. IF THE REQUEST HAS NOT BEEN ADDRESSED, RESPOND WITH CODE TO ADDRESS IT. IF A FAILURE OCCURRED (e.g., due to a missing library) AND SOME ADDITIONAL CODE WAS WRITTEN (e.g. code to install the library), ENSURE THAT THE ORIGINAL CODE TO ADDRESS THE TASK STILL GETS EXECUTED. If the request HAS been addressed, respond with a summary of the result. The summary must be written as a coherent helpful response to the user request e.g. 'Sure, here is result to your request ' or 'The tallest mountain in Africa is ..' etc. The summary MUST end with the word TERMINATE. If the  user request is pleasantry or greeting, you should respond with a pleasantry or greeting and TERMINATE.",
            "humanInputMode": None,
            "model": "gpt-4",
            "credentialId": ObjectId("65b829521c6b30efe9d7509f"),
            "toolIds": [ObjectId(generate_images_id), ObjectId(find_papers_arxiv_id)],
            "datasourceIds": [],
        }

        add_agent(agent_dict=primary_assistant_dict)
        recreate_for_35(agent_dict=primary_assistant_dict)
