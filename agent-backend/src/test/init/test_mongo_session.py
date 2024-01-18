
import pytest

from init.mongo_session import start_mongo_session



@pytest.mark.require_docker
class TestMongoSession:
    def test_mongo_session(self):
        mongo_client = start_mongo_session()
        connection = mongo_client.connect()
        result = connection.server_info()["ok"] == 1.0
        connection.close()

        assert result
