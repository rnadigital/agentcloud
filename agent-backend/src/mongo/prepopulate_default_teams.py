from bson import ObjectId
from pymongo import MongoClient


def add_group(group_dict: dict) -> None:
    """
    Add a group to the mongo database.
    """
    assert isinstance(group_dict, dict), "group_dict must be a dictionary."

    cnxn = MongoClient()
    mongo_client = cnxn["test"]

    # Upload input_json to mongo
    mongo_client["groups"].insert_one(group_dict)
    # Disconnect from mongo
    cnxn.close()


def reset_default_groups() -> None:
    """
    Delete groups present and reset the mongo database with default groups.
    """
    cnxn = MongoClient()
    mongo_client = cnxn["test"]

    # Delete all existing groups
    mongo_client["groups"].delete_many({})

    # Get 3.5 agent id
    user_proxy = mongo_client["agents"].find_one({"name": "userproxy3.5"})
    user_proxy_id = str(user_proxy["_id"])

    pri_assistant = mongo_client["agents"].find_one({"name": "general_assistant"})
    pri_assistant_id = str(pri_assistant["_id"])

    ga = mongo_client["agents"].find_one({"name": "general_assistant3.5"})
    ga_id = str(ga["_id"])

    assert (
        len(user_proxy_id) * len(pri_assistant_id) * len(ga_id) != 0
    ), "User proxy, primary assistant or general assistant not found."

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
        debate_grp_dict = {
            "orgId": ObjectId(org_id),
            "teamId": ObjectId(team_id),
            "name": "Demo debate group",
            "agents": [ObjectId(pri_assistant_id), ObjectId(ga_id)],
            "adminAgent": ObjectId(user_proxy_id),
            "groupChat": True,
        }

        add_group(group_dict=debate_grp_dict)
