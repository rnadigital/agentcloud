import uuid

from langchain_core.messages import HumanMessage, ToolMessage, AIMessage
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.constants import END
from langgraph.graph import StateGraph, MessagesState, START
from langgraph.prebuilt import ToolNode

from chat.agents.base import BaseChatAgent
from chat.mongo_db_saver import AsyncMongoDBSaver
from tools.global_tools import CustomHumanInput


class OpenAIChatAgent(BaseChatAgent):
    """
    Contains the graph, defines flow of messages between the nodes, calls tools
    """

    async def call_model(self, state, config):
        messages = state["messages"]

        response = await self.chat_model.ainvoke(messages, config)

        # If llm returns AIMessage with a tool_call to human_input and content as tool args (in response to a prior
        # human_input ToolMessage) then set it as AIMessage content and invalidate the tool_call.
        # This behaviour is seen in Gemini and sometimes with gpt-4o-mini.

        # If this is not handled, message flow will continuously loop between ToolMessage and AIMessage
        # and not exit the graph until recursion_limit is reached.
        if ((isinstance(messages[-1], ToolMessage)
             and messages[-1].name == 'human_input')
                and (isinstance(response, AIMessage)
                     and response.tool_calls
                     and response.tool_calls[0]['name'] == 'human_input')):
            response.content = response.tool_calls[0]['args']['text']
            response.tool_calls = []
            response.additional_kwargs = {}

            # also send to socket because content being appended as a tool arg prevents
            # it from being streamed until tool is invoked which is the case here.
            self.send_to_socket(text=response.content, chunk_id=str(uuid.uuid4()),
                                author_name=self.agent_name.capitalize(),
                                display_type="bubble")

        return {"messages": response}

    async def invoke_human_input(self, state, config):
        """
        Same as `call_model` except it appends a prompt to invoke the human input tool to message state
        """
        messages = (state["messages"] +
                    [HumanMessage(content="Use the human_input tool to ask the user what assistance they need")])
        response = await self.chat_model.ainvoke(messages, config={**config, 'tags': ['no_stream']})
        return {"messages": [response]}

    def build_graph(self):
        human_input_tool = CustomHumanInput(self.socket, self.session_id, author_name=self.agent_name)

        self.chat_model = self.chat_model.bind_tools(self.tools + [human_input_tool])

        human_input_node = ToolNode([human_input_tool])
        tools_node = ToolNode(self.tools)

        graph = StateGraph(MessagesState)
        graph.add_node("chat_model", self.call_model)
        graph.add_node("human_input", human_input_node)
        graph.add_node("tools", tools_node)
        graph.add_node("human_input_invoker", self.invoke_human_input)

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

        def start_condition(state):
            messages = state["messages"]
            last_message = messages[-1]
            if isinstance(last_message, AIMessage) and last_message.tool_calls:
                if last_message.tool_calls[0]["name"] == "human_input":
                    return "human_input"
                return "tools"
            else:
                return "human_input_invoker"

        graph.add_conditional_edges(
            START,
            start_condition,
            {
                # If `tools`, then we call the tool node.
                "tools": "tools",
                "human_input": "human_input",
                "human_input_invoker": "human_input_invoker"
            },
        )
        graph.add_edge("human_input_invoker", "human_input")
        graph.add_edge("human_input", "chat_model")
        graph.add_edge("tools", "chat_model")
        graph.add_conditional_edges(
            "chat_model",
            should_continue,
            {
                # If `tools`, then we call the tool node.
                "continue": "tools",
                "human_input": "human_input",
                # Otherwise we finish and go back to human input invoker. Always end with human_input_invoker
                "end": END
            },
        )

        # Set up memory
        memory = AsyncMongoDBSaver()

        return graph.compile(checkpointer=memory)
