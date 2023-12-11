from socketio import SimpleClient
from typing import Optional, Union


def send(
        socket_client: SimpleClient,
        sid: str,
        event: str,
        sender_name: Optional[str],
        message: Union[dict, str],
        single: bool = False,
        first: bool = False):
    socket_client.emit(event, {
        "room": sid,
        "authorName": sender_name,
        "message": message,
        "first": first,
        "single": single
    })
