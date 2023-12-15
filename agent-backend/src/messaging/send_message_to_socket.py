from datetime import datetime

from socketio import SimpleClient
from typing import Optional, Union


def send(
        socket_client: SimpleClient,
        sid: str,
        event: str,
        sender_name: Optional[str],
        message: Union[dict, str],
        message_id: str,
        tokens: int,
        single: bool = False,
        first: bool = False):
    socket_client.emit(event, {
        "room": sid,
        "authorName": sender_name,
        "message": message,
        "chunkId": message_id,
        "tokens": tokens,
        "first": first,
        "single": single,
        "timestamp": datetime.now().timestamp() * 1000
    })
