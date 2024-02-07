import pytest
import mongo.client as mgc


@pytest.mark.require_docker_compose_up
class TestQdrantConnection:
    def test_get_connection_success(self):
        # Test the successful creation of a Qdrant connection
        # Replace 'localhost' and 6333 with actual values if different
        cnxn = mgc.MongoConnection()
        mongo_client = cnxn.connect()
        assert len(mongo_client.list_database_names()) > 1
