# test_qdrant_connection.py
import pytest
import qdrantClient.qdrant_connection as qdc


@pytest.mark.require_docker_compose_up
class TestQdrantConnection:
    def test_get_connection_success(self):
        # Test the successful creation of a Qdrant connection
        # Replace 'localhost' and 6333 with actual values if different
        client = qdc.get_connection(host="localhost", port=6333)
        assert client is not None

    def test_get_connection_invalid_host(self):
        # Test connection failure due to invalid host
        with pytest.raises(ValueError):
            qdc.get_connection(host="", port=6333)

    def test_get_connection_invalid_port(self):
        # Test connection failure due to invalid port
        with pytest.raises(ValueError):
            qdc.get_connection(host="localhost", port=0)
