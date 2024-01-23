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

    @pytest.mark.require_openai_api
    def test_populate_collection_success(self):
        # Test the successful population of a collection
        # Replace 'localhost' and 6333 with actual values if different
        client = qdc.get_connection(host="localhost", port=6333)
        collection_name = "devcollection_barack_obama"
        docs_path = "https://en.wikipedia.org/wiki/Barack_Obama"
        agents = qdc.populate_collection(client, collection_name, docs_path)
        assert len(agents) > 0

        # reset the assistant. Always reset the assistant before starting a new conversation.
        agents["llm_assistant_agent"].reset()

        qa_problem = "What is the exact date of Barack Obama birthday?"
        agents["qdrant_retrieve_user_proxy_agent"].initiate_chat(
            agents["llm_assistant_agent"], problem=qa_problem
        )

        print(agents["qdrant_retrieve_user_proxy_agent"].last_message())
        assert (
            "1961"
            in agents["qdrant_retrieve_user_proxy_agent"].last_message()["content"]
        )

        # Clean up
        client.delete_collection(collection_name)
        client.close()
