from init.env_variables import SOCKET_URL, BASE_PATH


class TestEnvariables:
    # Assert that the constants are not null
    def test_non_null_constants(self):
        assert len(SOCKET_URL) > 0
        assert len(BASE_PATH) > 0
