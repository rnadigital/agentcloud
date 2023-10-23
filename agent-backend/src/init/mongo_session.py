from mongo.queries import MongoClientConnection


def start_mongo_session() -> MongoClientConnection:
    return MongoClientConnection()
