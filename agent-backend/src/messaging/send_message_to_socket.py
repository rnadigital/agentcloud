from models.sockets import SocketMessage, SocketEvents
from socketio import SimpleClient


def send(client: SimpleClient, event: SocketEvents, message: SocketMessage):
    client.emit(event.value, message.model_dump())
