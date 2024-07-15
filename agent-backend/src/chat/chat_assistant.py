import asyncio
import logging
import re
import uuid
from datetime import datetime

from langchain_core.language_models import BaseLanguageModel
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
from langchain_core.tools import tool, BaseTool
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph.graph import CompiledGraph
from langgraph.prebuilt import ToolNode
from langgraph.graph import MessagesState
from langgraph.graph import START, END, StateGraph
from socketio import SimpleClient
from socketio.exceptions import ConnectionError

from init.env_variables import SOCKET_URL, AGENT_BACKEND_SOCKET_TOKEN
from init.mongo_session import start_mongo_session
from lang_models import model_factory as language_model_factory
from messaging.send_message_to_socket import send
from models.mongo import App, Tool, Datasource, Model, ToolType, Agent
from models.sockets import SocketEvents, SocketMessage, Message
from redisClient.utilities import RedisClass
from tools import RagTool, GoogleCloudFunctionTool
from tools.builtin_tools import BuiltinTools
from tools.global_tools import CustomHumanInput

redis_con = RedisClass()


class ChatAssistant:
    chat_model: BaseLanguageModel
    tools: list[BaseTool]
    workflow: CompiledGraph
    system_message: str
    agent_name: str

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.socket = SimpleClient()
        self.mongo_client = start_mongo_session()
        self.init_socket()
        self.init_app_state()
        self.init_graph()

    def init_socket(self):
        try:
            # Initialize the socket client and connect
            logging.debug(f"Socket URL: {SOCKET_URL}")
            custom_headers = {"x-agent-backend-socket-token": AGENT_BACKEND_SOCKET_TOKEN}
            self.socket.connect(url=SOCKET_URL, headers=custom_headers)
            self.socket.emit("join_room", f"_{self.session_id}")
        except ConnectionError as ce:
            logging.error(f"Connection error occurred: {ce}")
            raise

    def init_app_state(self):
        session = self.mongo_client.get_session(self.session_id)

        app = self.mongo_client.get_single_model_by_id("apps", App, session.get('appId'))

        app_config = app.chatAppConfig
        if not app_config:
            raise

        agentcloud_agent = self.mongo_client.get_single_model_by_id("agents", Agent, app_config.agentId)
        self.agent_name = agentcloud_agent.name

        agentcloud_tools = self.mongo_client.get_models_by_ids("tools", Tool, agentcloud_agent.toolIds)

        self.system_message = '\n'.join([agentcloud_agent.role, agentcloud_agent.goal, agentcloud_agent.backstory])

        model = self.mongo_client.get_single_model_by_id("models", Model, agentcloud_agent.modelId)
        self.chat_model = language_model_factory(model)

        self.tools = list(map(self._make_langchain_tool, agentcloud_tools))

    @staticmethod
    def _transform_tool_name(tool_name: str) -> str:
        """
        Remove all non-alphanumeric characters from tool name except spaces, hyphens and underscores,
        and re-join them else llm will complain (allowed chars: [a-zA-Z0-9_-])
        """
        return '_'.join(re.sub(r'[^a-zA-Z0-9 _-]', '', tool_name).split())

    def _make_langchain_tool(self, agentcloud_tool: Tool):
        tool_class = None

        agentcloud_tool.name = self._transform_tool_name(agentcloud_tool.name)

        if agentcloud_tool.type == ToolType.RAG_TOOL:
            datasource = self.mongo_client.get_single_model_by_id("datasources", Datasource,
                                                                  agentcloud_tool.datasourceId)
            embedding_model = self.mongo_client.get_single_model_by_id("models", Model, datasource.modelId)
            embedding = language_model_factory(embedding_model)

            return RagTool.factory(tool=agentcloud_tool,
                                   models=[(embedding, embedding_model)],
                                   datasources=[datasource],
                                   llm=self.chat_model)
        elif agentcloud_tool.type == ToolType.HOSTED_FUNCTION_TOOL and not agentcloud_tool.data.builtin:
            tool_class = GoogleCloudFunctionTool
        elif agentcloud_tool.data.builtin:
            tool_class = BuiltinTools.get_tool_class(agentcloud_tool.data.name)

        return tool_class.factory(agentcloud_tool)

    def init_graph(self):
        def call_model(state):
            messages = state["messages"]
            response = self.chat_model.invoke(messages)
            # We return a list, because this will get added to the existing list
            return {"messages": [response]}

        def invoke_human_input(state):
            """
            Same as `call_model` except it appends a prompt to invoke the human input tool to message state
            """
            messages = (state["messages"] +
                        [HumanMessage(content="Use the human_input tool to ask the user what assistance they need")])
            response = self.chat_model.invoke(messages)
            return {"messages": [response]}

        human_input_tool = CustomHumanInput(self.socket, self.session_id)

        self.chat_model = self.chat_model.bind_tools(self.tools + [human_input_tool])

        human_input_node = ToolNode([human_input_tool])
        tools_node = ToolNode(self.tools)

        workflow = StateGraph(MessagesState)
        workflow.add_node("chat_model", call_model)
        workflow.add_node("human_input", human_input_node)
        workflow.add_node("tools", tools_node)
        workflow.add_node("human_input_invoker", invoke_human_input)

        workflow.add_edge(START, "human_input_invoker")
        workflow.add_edge("human_input_invoker", "human_input")
        workflow.add_edge("human_input", "chat_model")
        workflow.add_edge("tools", "chat_model")

        def should_continue(state):
            messages = state["messages"]
            last_message = messages[-1]
            # If there is no function call, then we finish
            if not last_message.tool_calls:
                return "end"
            # allow for human-in-the-loop flow
            elif last_message.tool_calls[0]["name"] == "human_input":
                return "human_input"
            # Otherwise if there is, we continue
            else:
                return "continue"

        workflow.add_conditional_edges(
            "chat_model",
            should_continue,
            {
                # If `tools`, then we call the tool node.
                "continue": "tools",
                "human_input": "human_input",
                # Otherwise we finish and go back to human input invoker. Always end with human_input_invoker
                "end": "human_input_invoker"
            },
        )

        # Set up memory
        memory = MemorySaver()

        self.workflow = workflow.compile(checkpointer=memory)

    def run(self):
        config = {"configurable": {"thread_id": self.session_id}}
        system_message = SystemMessage(content=self.system_message)
        asyncio.run(self.stream_execute([system_message], config))

    def stop_generating_check(self):
        try:
            stop_flag = redis_con.get(f"{self.session_id}_stop")
            logging.debug(f"stop_generating_check for session: {self.session_id}, stop_flag: {stop_flag}")
            return stop_flag == "1"
        except:
            return False

    async def stream_execute(self, messages: list[BaseMessage], config: dict):
        chunk_id = str(uuid.uuid4())
        tool_chunk_id = {}
        first = True

        try:
            async for event in self.workflow.astream_events(
                    {
                        "messages": messages,
                    },
                    config=config,
                    version="v1",
            ):
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
                        self.send_to_socket(text=content, event=SocketEvents.MESSAGE,
                                            first=first, chunk_id=chunk_id,
                                            timestamp=datetime.now().timestamp() * 1000,
                                            author_name=self.agent_name.capitalize(),
                                            display_type="bubble")
                        first = False
                        logging.debug(f"Text chunk_id ({chunk_id}): {chunk}")

                    # chain chunk
                    # case "on_chain_stream":
                    #     content = (event.get('data', {})
                    #         .get('chunk', {})
                    #         .get('tools'))
                    #     if content:
                    #         content = content.get('messages')[0].content
                    #         chunk = repr(content)
                    #         self.send_to_socket(content, SocketEvents.MESSAGE, first, chunk_id, datetime.now().timestamp() * 1000,
                    #                              "bubble")
                    #         first = False
                    #         logging.debug(f"Text chunk_id ({chunk_id}): {chunk}", flush=True)

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
                        tool_name = event.get('name').replace('_', ' ').capitalize()
                        tool_chunk_id[tool_name] = str(uuid.uuid4())
                        self.send_to_socket(text=f"Using tool: {tool_name}", event=SocketEvents.MESSAGE,
                                            first=True, chunk_id=tool_chunk_id[tool_name],
                                            timestamp=datetime.now().timestamp() * 1000,
                                            display_type="inline")

                    # tool finished being used
                    case "on_tool_end":
                        logging.debug(f"{kind}:\n{event}")
                        tool_name = event.get('name').replace('_', ' ').capitalize()
                        self.send_to_socket(text=f"Finished using tool: {tool_name}", event=SocketEvents.MESSAGE,
                                            first=True, chunk_id=tool_chunk_id[tool_name],
                                            timestamp=datetime.now().timestamp() * 1000,
                                            display_type="inline", overwrite=True)
                        del tool_chunk_id[tool_name]

                    # see https://python.langchain.com/docs/expression_language/streaming#event-reference
                    case _:
                        logging.debug(f"unhandled {kind} event")
        except Exception as chunk_error:
            import sys, traceback
            exc_type, exc_value, exc_traceback = sys.exc_info()
            err_lines = traceback.format_exception(exc_type, exc_value, exc_traceback)
            logging.error(err_lines)
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

    def send_to_socket(self, text='', event=SocketEvents.MESSAGE, first=True, chunk_id=None,
                       timestamp=None, display_type='bubble', author_name='System', overwrite=False):

        if type(text) != str:
            text = "NON STRING MESSAGE"

        # Set default timestamp if not provided
        if timestamp is None:
            timestamp = int(datetime.now().timestamp() * 1000)

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
