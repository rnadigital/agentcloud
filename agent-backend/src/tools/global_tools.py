from typing import Optional
from uuid import uuid4

from langchain.tools import tool
from socketio import SimpleClient

from messaging.send_message_to_socket import send
from models.sockets import SocketEvents, SocketMessage, Message


class GlobalTools:
    @tool("Get papers from Arxiv")
    def get_papers_from_arxiv(query: str) -> list:
        """Gets papers from Arxiv"""
        try:
            import arxiv

            search = arxiv.Search(
                query=query, max_results=10, sort_by=arxiv.SortCriterion.SubmittedDate
            )
            results = []
            for result in arxiv.Client().results(search):
                results.append(result.title)
            return results
        except Exception as e:
            print(f"An error occurred: {str(e)}")


class OpenAi:
    @tool("Open AI request")
    def openapi_request(**kwargs):
        """Makes Open AI request"""
        try:
            import requests

            base_url = kwargs.get("__baseurl")
            endpoint = kwargs.get("__path")
            request_method = getattr(requests, kwargs.get("__method"))
            kwargs.pop("__baseurl")
            kwargs.pop("__path")
            kwargs.pop("__method")
            response = request_method(base_url + endpoint, params=kwargs)
            if response.status_code == 200:
                return response.json()
            else:
                return None
        except Exception as e:
            print(f"An error occurred: {str(e)}")


class HumanInput:
    """
    A class designed to facilitate communication between a server and a client
    over a socket connection for sending human input messages and receiving feedback.

    This class initializes with a socket client and a session identifier to manage messages
    for a specific connection session.

    Attributes:
        None. There are no class attributes required

    Methods:
        human_input(event, text, first, chunkId):
            Sends a text message through a socket connection based on specified parameters and waits for feedback.
    """

    def __init__(self, socket_client: SimpleClient, session_id: str):
        self.socket_client = socket_client
        self.session_id = session_id

    @staticmethod
    @tool("Human Input Tool")
    def human_input(
            self,
            event: Optional[SocketEvents] = SocketEvents.HUMAN_INPUT,
            text: Optional[str] = None,
            first: Optional[bool] = False,
            chunkId: Optional[str] = uuid4().hex
    ) -> str:
        """
        Sends a text input to a client through the socket connection managed by this instance
        and waits for feedback.

        Parameters:

            event (SocketEvents): An enum value representing the type of event to emit, dictating
                the nature of the message being sent (e.g., message event, typing event).

            text (str): The text message content to be sent to the client.

            first (bool): Indicates if this message is the first chunk of a segmented message,
                aiding in message partitioning.

            chunkId (Optional[str]): A UUID as a string that serves as an identifier for the message
                chunk, defaulting to a new UUID if not provided. It's used for associating
                different parts of a segmented message.

        Returns:
            str: Feedback received from the client as a string. Returns "exit" if a timeout
                error occurs during the process.

        Raises:
            TimeoutError: Triggered if there's a timeout while awaiting a response from
                the client. An error message is emitted to the client before the method returns "exit".

        This method constructs and sends a structured message based on the provided parameters,
        handling any potential timeouts by notifying the client of an error.
        """
        try:
            send(
                self.socket_client,
                SocketEvents(event),
                SocketMessage(
                    room=self.session_id,
                    authorName="system",
                    message=Message(
                        chunkId=chunkId,
                        text=text,
                        first=first,
                        tokens=1,  # Assumes 1 token is a constant value for message segmentation.
                    ),
                    isFeedback=True,
                ),
                "both"
            )
            feedback = self.socket_client.receive()
            return feedback[1]
        except TimeoutError:
            self.socket_client.emit(
                "message",
                {
                    "room": self.session_id,
                    "type": "error",
                    "message": "TimeOutError"},
            )
            return "exit"
