from pydantic import BaseModel, constr, conint
from qdrant_client import QdrantClient


def get_connection(host: str, port: int) -> QdrantClient:
    # Check inputs
    class QdrantConnection(BaseModel):
        host: constr(min_length=2)
        port: conint(gt=0)  # Port number should be greater than 0

    # Validate and create connection
    connection = QdrantConnection(host=host, port=port)

    # Connect to Qdrant
    client = QdrantClient(host=connection.host, port=connection.port)

    try:
        # Request a list of collections from Qdrant
        collections = client.get_collections()
        print("Successfully connected to Qdrant. Collections:", collections)
    except Exception as e:
        # Handle exceptions (e.g., connection errors)
        print(f"Failed to connect to Qdrant: {e}")

    return client
