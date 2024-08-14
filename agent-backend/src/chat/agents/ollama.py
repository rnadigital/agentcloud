import uuid

from langchain_core.messages import AIMessage, HumanMessage

from chat.agents.open_ai import OpenAIChatAgent


class OllamaChatAgent(OpenAIChatAgent):
    """
    Customization for Ollama models
    """

    async def invoke_human_input(self, state, config):
        messages = state["messages"] + [
            HumanMessage(content="Ask user what assistance they need or if they have any further query")]

        response = await self.chat_model.ainvoke(messages, config={**config, 'tags': ['no_stream']})

        if isinstance(response, AIMessage) and len(response.tool_calls) == 0:
            response.tool_calls.append({
                "name": "human_input",
                "args": {
                    "text": response.content,
                },
                "id": str(uuid.uuid4())
            })

        return {"messages": response}
