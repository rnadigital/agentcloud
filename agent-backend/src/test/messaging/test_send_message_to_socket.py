import pytest
from unittest.mock import MagicMock, patch
from models.sockets import SocketMessage, SocketEvents
from socketio import SimpleClient
import messaging.send_message_to_socket as sms
from pydantic import ValidationError

class TestSend:
    @pytest.fixture
    def mock_client(self):
        return MagicMock(spec=SimpleClient)

    @pytest.fixture
    def mock_event(self):
        return MagicMock(spec=SocketEvents)

    @pytest.fixture
    def mock_message(self):
        return MagicMock(spec=SocketMessage)

    def test_send_with_invalid_socket_or_logging(self, mock_client, mock_event, mock_message):
        with pytest.raises(AssertionError) as excinfo:
            sms.send(mock_client, mock_event, mock_message, socket_logging="invalid_value")
        assert "socket_or_logging should be ['socket', 'logging', 'both']" in str(excinfo.value)


    def test_send_socket_behavior_none_inputs(self):
        with pytest.raises(AssertionError) as excinfo:
            sms.send(None, None, None, socket_logging="socket")
        assert "client cannot be None" in str(excinfo.value)


