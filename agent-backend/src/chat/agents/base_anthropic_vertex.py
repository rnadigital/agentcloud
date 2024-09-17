from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from chat.agents.open_ai import OpenAIChatAgent


class BaseAnthropicVertexChatAgent(OpenAIChatAgent):
    """
    Customizations that work for both Anthropic and Vertex/Gemini models
    """
    async def call_model(self, state, config):
        messages = state["messages"]
        updates = False
        if isinstance(messages[0], SystemMessage) and not isinstance(messages[1], HumanMessage):
            # to work around the "first message is not user message" error
            messages.insert(1, HumanMessage(content="<< dummy message >>"))
            updates = True
        if len(messages) >= 3 and isinstance(messages[-2], AIMessage) and isinstance(messages[-3], AIMessage):
            # to work around the "roles must alternate between "user" and "assistant"..." error
            messages.insert(-2, HumanMessage(content="<< dummy message >>"))
            updates = True

        if updates:
            self.graph.update_state(config, {"messages": messages})
        return await super().call_model(state, config)
