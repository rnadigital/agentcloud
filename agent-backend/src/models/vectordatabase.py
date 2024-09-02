from enum import Enum

class VectorDatabase(str, Enum):
    Qdrant = "qdrant"
    Pinecone = "pinecone"