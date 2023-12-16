from datetime import datetime

from pydantic import BaseModel
from enum import Enum
from typing import List, Optional
import json


class SocketEvents(Enum):
    MESSAGE = "message"
    MESSAGES_COMPLETE = "message_complete"


class MessageType(Enum):
    TEXT = "text"
    CODE = "code"


class SocketMessage(BaseModel):
    room: str
    message: str
    chunkId: Optional[str] = None
    codeBlock: Optional[List[str]] = None
    tokens: Optional[int] = None
    deltaTokens: Optional[int] = None
    first: Optional[bool] = False
    single: Optional[bool] = False
    isFeedback: Optional[bool] = False
    type: Optional[MessageType] = MessageType.TEXT.value
    timestamp: Optional[float] = datetime.now().timestamp() * 1000

    def json(self, **kwargs):
        # Convert the model to a dictionary and replace enum with its value
        d = self.model_dump()
        d['event'] = d['event'].value  # Convert Enum to string
        return json.dumps(d, **kwargs)
