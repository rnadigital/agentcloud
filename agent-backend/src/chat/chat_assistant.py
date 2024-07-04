import asyncio
import logging
import uuid
from datetime import datetime

from langchain_core.embeddings import Embeddings
from langchain_core.language_models import BaseLanguageModel
from langchain_core.messages import HumanMessage, SystemMessage
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
from models.mongo import App, Tool, Datasource, Model, PyObjectId, ToolType
from models.sockets import SocketEvents, SocketMessage, Message
from redisClient.utilities import RedisClass
from tools import RagTool, GoogleCloudFunctionTool
from tools.builtin_tools import BuiltinTools
from tools.global_tools import CustomHumanInput

redis_con = RedisClass()


class ChatAssistant:
    chat_model: BaseLanguageModel
    tools: list[BaseTool]
    datasource: Datasource
    workflow: CompiledGraph
    system_message: str

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.socket = SimpleClient()
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
        mongo_client = start_mongo_session()
        session = mongo_client.get_session(self.session_id)

        app: App
        # We only want app, unpack and forget the rest
        # TODO: add a method to fetch app from crewID without using this method;
        #  better still, don't have crewID for chat apps
        app, *_ = mongo_client.get_crew(session)

        app_config = app.chatAppConfig
        if not app_config:
            raise

        self.system_message = app_config.systemMessage

        model = mongo_client.get_single_model_by_id("models", Model, app_config.modelId)
        self.chat_model = language_model_factory(model)

        embedding = embedding_model = None
        if app_config.datasourceId:
            self.datasource = mongo_client.get_single_model_by_id("datasources", Datasource, app_config.datasourceId)
            if self.datasource:
                embedding_model = mongo_client.get_single_model_by_id("models", Model, self.datasource.modelId)
                embedding = language_model_factory(embedding_model)

        agentcloud_tools = mongo_client.get_models_by_ids("tools", Tool, app_config.toolIds)
        self.tools = [
            _make_langchain_tool(t, self.datasource, self.chat_model, [(embedding, embedding_model)])
            for t in agentcloud_tools]

    def init_graph(self):
        def call_model(state):
            messages = state["messages"]
            response = self.chat_model.invoke(messages)
            # We return a list, because this will get added to the existing list
            return {"messages": [response]}

        def invoke_human_input(state):
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

        workflow.add_edge(START, "chat_model")

        def should_continue(state):
            messages = state["messages"]
            last_message = messages[-1]
            # If there is no function call, then we finish
            if not last_message.tool_calls:
                return "end"
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
                # Otherwise we finish and go back to human input invoker.
                "end": "human_input_invoker"
            },
        )

        workflow.add_edge("tools", "chat_model")
        workflow.add_edge("human_input", "chat_model")
        workflow.add_edge("human_input_invoker", "human_input")

        # Set up memory
        memory = MemorySaver()

        self.workflow = workflow.compile(checkpointer=memory)

    def run(self):
        config = {"configurable": {"thread_id": self.session_id}}
        system_message = SystemMessage(content=self.system_message)
        input_message = HumanMessage(content="Use the human_input tool to ask the user what assistance they need")
        asyncio.run(self.stream_execute([system_message, input_message], config))

    def stop_generating_check(self):
        try:
            stop_flag = redis_con.get(f"{self.session_id}_stop")
            logging.debug(f"stop_generating_check for session: {self.session_id}, stop_flag: {stop_flag}")
            return stop_flag == "1"
        except:
            return False

    async def stream_execute(self, task_prompt, config):
        acc = ""
        chunk_id = str(uuid.uuid4())
        tool_chunk_id = str(uuid.uuid4())
        first = True

        try:
            async for event in self.workflow.astream_events(
                    {
                        "messages": task_prompt,
                    },
                    config=config,
                    version="v1",
            ):
                if self.stop_generating_check():
                    self.send_to_sockets(f"🛑 Stopped generating.", "message", True, str(uuid.uuid4()),
                                         datetime.now().timestamp() * 1000, "inline")
                    return

                kind = event["event"]
                logging.debug(f"{kind}:\n{event}", flush=True)
                match kind:
                    # message chunk
                    case "on_chat_model_stream":
                        content = event['data']['chunk'].content
                        chunk = repr(content)
                        self.send_to_sockets(content, "message", first, chunk_id, datetime.now().timestamp() * 1000,
                                             "bubble")
                        first = False
                        logging.debug(f"Text chunk_id ({chunk_id}): {chunk}", flush=True)

                    # praser chunk
                    case "on_parser_stream":
                        logging.debug(f"Parser chunk ({kind}): {event['data']['chunk']}", flush=True)

                    # tool chat message finished
                    case "on_chain_end":
                        self.send_to_sockets(acc, "message_complete", True, chunk_id, datetime.now().timestamp() * 1000,
                                             "bubble")
                        chunk_id = str(uuid.uuid4())
                        first = True

                    # tool started being used
                    case "on_tool_start":
                        logging.debug(f"{kind}:\n{event}", flush=True)
                        tool_chunk_id = str(uuid.uuid4())  # TODO:
                        tool_name = event.get('name').replace('_', ' ').capitalize()
                        self.send_to_sockets(f"Using tool: {tool_name}", "message", True, tool_chunk_id,
                                             datetime.now().timestamp() * 1000, "inline")

                    # tool finished being used
                    case "on_tool_end":
                        logging.debug(f"{kind}:\n{event}", flush=True)
                        tool_name = event.get('name').replace('_', ' ').capitalize()
                        self.send_to_sockets(f"Finished using tool: {tool_name}", "message_complete", True,
                                             tool_chunk_id, datetime.now().timestamp() * 1000, "inline")
                        tool_chunk_id = str(uuid.uuid4())

                    # see https://python.langchain.com/docs/expression_language/streaming#event-reference
                    case _:
                        logging.debug(f"unhandled {kind} event", flush=True)
        except Exception as chunk_error:
            import sys, traceback
            exc_type, exc_value, exc_traceback = sys.exc_info()
            err_lines = traceback.format_exception(exc_type, exc_value, exc_traceback)
            logging.error(err_lines)
            tool_chunk_id = str(uuid.uuid4())
            self.send_to_sockets(f"⛔ An unexpected error occurred", "message", True, str(uuid.uuid4()),
                                 datetime.now().timestamp() * 1000, "inline")
            # TODO: if debug:
            self.send_to_sockets(f"""Stack trace:
```
{chunk_error}
```
""", "message", True, str(uuid.uuid4()), datetime.now().timestamp() * 1000, "bubble")
            pass

    def send_to_sockets(self, text='', event=SocketEvents.MESSAGE, first=True, chunk_id=None,
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


def _make_langchain_tool(agentcloud_tool: Tool, datasource: Datasource, chat_model: BaseLanguageModel,
                         embed_models: list[tuple[Embeddings, Model]] = None):
    tool_class = None
    if agentcloud_tool.type == ToolType.RAG_TOOL:
        tool_class = RagTool
    elif agentcloud_tool.type == ToolType.HOSTED_FUNCTION_TOOL and not agentcloud_tool.data.builtin:
        tool_class = GoogleCloudFunctionTool
    elif agentcloud_tool.data.builtin:
        tool_class = BuiltinTools.get_tool_class(agentcloud_tool.data.name)

    agentcloud_tool.name = '_'.join(agentcloud_tool.name.split())
    return tool_class.factory(tool=agentcloud_tool, models=embed_models, datasources=[datasource], llm=chat_model)
