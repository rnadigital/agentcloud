from models.sockets import SocketMessage, SocketEvents
from socketio import SimpleClient
from typing import Any, List, Union, Optional
from pydantic import BaseModel, constr, validator, root_validator

import logging

import utils.class_checker as cch

def send(client: Optional[SimpleClient], event: Optional[SocketEvents], message: Optional[SocketMessage], socket_logging:str = "socket"):

    # Check inputs
    class Params(BaseModel):
        client: Any 
        event: Any
        message: Any
        socket_logging: constr(min_length=1)

        @validator("socket_logging")
        def check_socket_or_logging(cls, v):
            socket_logging = v.lower()
            assert socket_logging in ["socket", "logging", "both"], f"Invalid socket_logging value: {v}"
            return socket_logging
        
    
    params = Params(client=client, event=event, message=message, socket_logging=socket_logging)

    # Advanced checks
    if params.socket_logging in ["socket", "both"]:
        assert params.client is not None, "client cannot be None"
        assert params.event is not None, "event cannot be None"
        assert params.message is not None, "message cannot be None"
        # Assert types
        params.client = cch.check_instance_of_class(params.client, SimpleClient)
        params.event = cch.check_instance_of_class(params.event, SocketEvents)
        params.message = cch.check_instance_of_class(params.message, SocketMessage)
        

    # If logging, print message
    if params.socket_logging in ["logging", "both"]:
        logging.info(f"Sending message to socket: {params.message.model_dump()}")

    # If socket or both, send message to socket 
    if params.socket_logging in ["socket", "both"]:
        # If client is not connected, raise an error
        assert params.client.connected, "Socket client is not connected"
        client.emit(event=params.event.value, data=params.message.model_dump())
        
