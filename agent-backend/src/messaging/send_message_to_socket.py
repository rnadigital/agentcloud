from models.sockets import SocketMessage, SocketEvents
from socketio import SimpleClient


def send(client: SimpleClient, 
         event: SocketEvents, 
         message: SocketMessage):
    
    # Check inputs
    
    client.emit(event=event.value, data=message.model_dump())
