import logging
import traceback
import uuid
from abc import abstractmethod
from datetime import datetime

from langchain_core.language_models import BaseLanguageModel
from langchain_core.messages import BaseMessage
from langchain_core.tools import BaseTool
from socketio import SimpleClient

from messaging.send_message_to_socket import send
from models.sockets import SocketEvents, SocketMessage, Message
from redisClient.utilities import RedisClass


class BaseChatAgent:
    """
    Runtime for the chatbot. Contains the graph, orchestrates flow of messages between the nodes,
    calls tools, and responds with appropriate messages to the user's input.
    """

    def __init__(self, chat_model: BaseLanguageModel, tools: list[BaseTool], agent_name: str, session_id: str,
                 socket: SimpleClient):
        self.chat_model = chat_model
        self.tools = tools
        self.agent_name = agent_name
        self.session_id = session_id
        self.socket = socket
        self.graph = self.build_graph()
        self.redis_con = RedisClass()

    @abstractmethod
    def build_graph(self):
        raise NotImplementedError

    def stop_generating_check(self):
        try:
            stop_flag = self.redis_con.get(f"{self.session_id}_stop")
            logging.debug(f"stop_generating_check for session: {self.session_id}, stop_flag: {stop_flag}")
            return stop_flag == "1"
        except:
            return False

    def send_to_socket(self, text='', event=SocketEvents.MESSAGE, first=True, chunk_id=None,
                       timestamp=None, display_type='bubble', author_name='System', overwrite=False):

        if type(text) is str:
            text = str(text)

        # Set default timestamp if not provided
        if timestamp is None:
            timestamp = int(datetime.now().timestamp() * 1000)

        if (len(text.rstrip()) == 0 and first == True) or len(text) == 0:
            return  # Don't send empty first messages

        # send the message
        send(
            self.socket,
            SocketEvents(event),
            SocketMessage(
                room=self.session_id,
                authorName=author_name,
                message=Message(
                    chunkId=chunk_id,
                    text=text,
                    first=first,
                    tokens=1,
                    timestamp=timestamp,
                    displayType=display_type,
                    overwrite=overwrite,
                )
            ),
            "both"
        )

    @staticmethod
    def _parse_model_chunk(chunk_content) -> str:
        return chunk_content

    async def stream_execute(self, messages: list[BaseMessage], config: dict):
        chunk_id = str(uuid.uuid4())
        tool_chunk_id = {}
        first = True

        try:
            async for event in self.graph.astream_events({"messages": messages},
                                                         config=config, version="v1"):
                if self.stop_generating_check():
                    self.send_to_socket(text=f"🛑 Stopped generating.", event=SocketEvents.MESSAGE,
                                        first=True, chunk_id=str(uuid.uuid4()),
                                        timestamp=datetime.now().timestamp() * 1000,
                                        display_type="inline")
                    return

                kind = event["event"]
                logging.debug(f"{kind}:\n{event}")
                match kind:
                    # message chunk
                    case "on_chat_model_stream":
                        content = event['data']['chunk'].content
                        chunk = repr(content)
                        content = self._parse_model_chunk(content)
                        if type(content) is str:
                            self.send_to_socket(text=content, event=SocketEvents.MESSAGE,
                                                first=first, chunk_id=chunk_id,
                                                timestamp=datetime.now().timestamp() * 1000,
                                                author_name=self.agent_name.capitalize(),
                                                display_type="bubble")
                        first = False
                        logging.debug(f"Text chunk_id ({chunk_id}): {chunk}")

                    # parser chunk
                    case "on_parser_stream":
                        logging.debug(f"Parser chunk ({kind}): {event['data']['chunk']}")

                    # tool chat message finished
                    case "on_chain_end":
                        # Reset chunk_id
                        chunk_id = str(uuid.uuid4())
                        # Reset first
                        first = True

                    # tool started being used
                    case "on_tool_start":
                        logging.debug(f"{kind}:\n{event}")

                        # No longer sending human input tool usage start/end messages
                        raw_tool_name = event.get('name')
                        if raw_tool_name == 'human_input':
                            continue

                        tool_name = raw_tool_name.replace('_', ' ').capitalize()

                        # Use event->run_id as key for tool_chunk_id as that is guaranteed to be unique
                        # and won't be overwritten on concurrent runs of the same tool
                        run_id = event["run_id"]
                        tool_chunk_id[run_id] = str(uuid.uuid4())

                        self.send_to_socket(text=f"Using tool: {tool_name}", event=SocketEvents.MESSAGE,
                                            first=True, chunk_id=tool_chunk_id[run_id],
                                            timestamp=datetime.now().timestamp() * 1000,
                                            display_type="inline")

                    # tool finished being used
                    case "on_tool_end":
                        logging.debug(f"{kind}:\n{event}")

                        # No longer sending human input tool usage start/end messages
                        raw_tool_name = event.get('name')
                        if raw_tool_name == 'human_input':
                            continue

                        run_id = event["run_id"]

                        tool_name = raw_tool_name.replace('_', ' ').capitalize()
                        self.send_to_socket(text=f"Finished using tool: {tool_name}", event=SocketEvents.MESSAGE,
                                            first=True, chunk_id=tool_chunk_id[run_id],
                                            timestamp=datetime.now().timestamp() * 1000,
                                            display_type="inline", overwrite=True)
                        del tool_chunk_id[run_id]

                    # see https://python.langchain.com/docs/expression_language/streaming#event-reference
                    case _:
                        logging.debug(f"unhandled {kind} event")
        except Exception as chunk_error:
            logging.error(traceback.format_exc())
            self.send_to_socket(text=f"⛔ An unexpected error occurred", event=SocketEvents.MESSAGE,
                                first=True, chunk_id=str(uuid.uuid4()),
                                timestamp=datetime.now().timestamp() * 1000,
                                display_type="inline")
            # TODO: if debug:
            self.send_to_socket(text=f"""Stack trace:
                ```
                {chunk_error}
                ```
                """, event=SocketEvents.MESSAGE, first=True, chunk_id=str(uuid.uuid4()),
                                timestamp=datetime.now().timestamp() * 1000, display_type="bubble")
            pass

