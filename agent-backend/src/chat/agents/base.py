import logging
import traceback
import uuid
from abc import abstractmethod
from datetime import datetime

from langchain_core.messages import BaseMessage, SystemMessage, AIMessage, ToolMessage
from langgraph.errors import GraphRecursionError
from typing import TYPE_CHECKING

from messaging.send_message_to_socket import send
from models.sockets import SocketEvents, SocketMessage, Message
from redisClient.utilities import RedisClass

if TYPE_CHECKING:
    from ..chat_assistant import ChatAssistant


class BaseChatAgent:
    """
    Base class for the chatbot agent runtime.
    """

    def __init__(self, chat_assistant_obj: 'ChatAssistant'):
        self.chat_model = chat_assistant_obj.chat_model
        self.tools = chat_assistant_obj.tools
        self.agent_name = chat_assistant_obj.agent_name
        self.session_id = chat_assistant_obj.session_id
        self.socket = chat_assistant_obj.socket
        self.system_message = chat_assistant_obj.system_message
        self.max_messages = chat_assistant_obj.max_messages
        self.chat_assistant_obj = chat_assistant_obj
        self.graph = self.build_graph()
        self.redis_con = RedisClass()
        self.logger = logging.getLogger(f'ChatAgent | {self.agent_name}')

    @abstractmethod
    def build_graph(self):
        raise NotImplementedError

    def stop_generating_check(self):
        try:
            stop_flag = self.redis_con.get(f"{self.session_id}_stop")
            self.logger.debug(f"stop_generating_check for session: {self.session_id}, stop_flag: {stop_flag}")
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

        if len(text) == 0 and event == SocketEvents.MESSAGE:
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

    def _max_messages_limit_reached(self, msgs: list[BaseMessage]) -> bool:
        """
        Omit human_input tool messages before max message limit check
        """
        ai_msgs = list(filter(lambda x: isinstance(x, AIMessage), msgs))
        non_human_input_tool_msgs = list(filter(lambda x: isinstance(x, ToolMessage) and x.name != 'human_input', msgs))
        return len(ai_msgs) + len(non_human_input_tool_msgs) > self.max_messages

    async def stream_execute(self):
        config = {"configurable": {"thread_id": self.session_id}}

        while True:
            past_messages = (await self.graph.aget_state(config)).values.get("messages")

            if past_messages:
                if self._max_messages_limit_reached(past_messages):
                    # Not enforcing this check within the chain to allow chain to complete even if it exceeds limit
                    # slightly. Move it to inside `astream_events > on_chain_end` to enforce this limit strictly.
                    self.logger.info(f"Maximum messages limit reached for session '{self.session_id}'. Ending chat.")
                    self.send_to_socket(text=f"MAX_MESSAGES_LIMIT REACHED", event=SocketEvents.MESSAGE,
                                        first=True, chunk_id=str(uuid.uuid4()),
                                        timestamp=datetime.now().timestamp() * 1000,
                                        display_type="inline")
                    self.send_to_socket(event=SocketEvents.STOP_GENERATING, chunk_id=str(uuid.uuid4()))
                    return
                messages = past_messages
            else:
                messages = [SystemMessage(content=self.system_message)]

            chunk_id = str(uuid.uuid4())
            tool_chunk_id = {}
            first = True

            try:
                async for event in self.graph.astream_events({"messages": messages},
                                                             config=config, version="v2"):
                    if self.stop_generating_check():
                        self.send_to_socket(text=f"🛑 Stopped generating.", event=SocketEvents.MESSAGE,
                                            first=True, chunk_id=str(uuid.uuid4()),
                                            timestamp=datetime.now().timestamp() * 1000,
                                            display_type="inline")
                        return

                    kind = event["event"]
                    self.logger.debug(f"{kind}:\n{event}")
                    match kind:
                        # message chunk
                        case "on_chat_model_stream":
                            content = event['data']['chunk'].content
                            chunk = repr(content)
                            content = self._parse_model_chunk(content)
                            tags = event['tags'] or []
                            if type(content) is str and not any(x in tags for x in {'rag_retrieval', 'no_stream'}):
                                self.send_to_socket(text=content, event=SocketEvents.MESSAGE,
                                                    first=first, chunk_id=chunk_id,
                                                    timestamp=datetime.now().timestamp() * 1000,
                                                    author_name=self.agent_name.capitalize(),
                                                    display_type="bubble")
                            first = False
                            self.logger.debug(f"Text chunk_id ({chunk_id}): {chunk}")

                        # parser chunk
                        case "on_parser_stream":
                            self.logger.debug(f"Parser chunk ({kind}): {event['data']['chunk']}")

                        # tool chat message finished
                        case "on_chain_end":
                            # input_messages = event['data']['input']['messages'] \
                            #     if ('input' in event['data'] and 'messages' in event['data']['input']) \
                            #     else None
                            # if type(input_messages) is list:
                            #     if self._max_messages_limit_reached(input_messages):
                            #         self.logger.info(
                            #             f"Maximum messages limit reached for session '{self.session_id}'. Ending chat.")
                            #         self.send_to_socket(text=f"MAX_MESSAGES_LIMIT REACHED", event=SocketEvents.MESSAGE,
                            #                             first=True, chunk_id=str(uuid.uuid4()),
                            #                             timestamp=datetime.now().timestamp() * 1000,
                            #                             display_type="inline")
                            #         self.send_to_socket(event=SocketEvents.STOP_GENERATING, chunk_id=str(uuid.uuid4()))
                            #         return
                            # Reset chunk_id
                            chunk_id = str(uuid.uuid4())
                            # Reset first
                            first = True

                        # tool started being used
                        case "on_tool_start":
                            self.logger.debug(f"{kind}:\n{event}")

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
                            self.logger.debug(f"{kind}:\n{event}")

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
                            self.logger.debug(f"unhandled {kind} event")
            except GraphRecursionError as ge:
                self.logger.info(f"Maximum recursion limit reached for session '{self.session_id}'. Ending chat.")
                self.send_to_socket(text=f"MAX_RECURSION_LIMIT REACHED", event=SocketEvents.MESSAGE,
                                    first=True, chunk_id=str(uuid.uuid4()),
                                    timestamp=datetime.now().timestamp() * 1000,
                                    display_type="inline")
                self.send_to_socket(
                    event=SocketEvents.STOP_GENERATING,
                    chunk_id=str(uuid.uuid4()),
                )

            except Exception as chunk_error:
                self.logger.error(traceback.format_exc())
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

                if 'Error code: 400' in str(chunk_error):
                    # Terminate on some 400's (from openAI) such as not being on a high enough tier for a model, to prevent an infinite loop of error
                    self.send_to_socket(
                        event=SocketEvents.STOP_GENERATING,
                        chunk_id=str(uuid.uuid4()),
                    )
                pass
