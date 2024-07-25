from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from chat.agents.default import DefaultChatAgent


class AnthropicChatAgent(DefaultChatAgent):
    async def call_model(self, state, config):
        messages = state["messages"]
        if isinstance(messages[0], SystemMessage) and not isinstance(messages[1], HumanMessage):
            # to work around the "first message is not user message" error
            messages.insert(1, HumanMessage(content="<< dummy message >>"))
        if len(messages) >= 3 and isinstance(messages[-2], AIMessage) and isinstance(messages[-3], AIMessage):
            # to work around the "roles must alternate between "user" and "assistant"..." error
            messages.insert(-2, HumanMessage(content="<< dummy message >>"))

        # Refer: https://langchain-ai.github.io/langgraph/how-tos/streaming-tokens/
        response = await self.chat_model.ainvoke(messages, config)
        return {"messages": response}

    @staticmethod
    def _parse_model_chunk(chunk_content: list) -> str:
        if len(chunk_content) > 0:
            if "text" in chunk_content[0]:
                return chunk_content[0]["text"]
            elif "partial_json" in chunk_content[0]:
                return chunk_content[0]["partial_json"]
        return ""
