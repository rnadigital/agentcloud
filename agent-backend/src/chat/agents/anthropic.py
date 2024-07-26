from chat.agents.base_anthropic_vertex import BaseAnthropicVertexChatAgent


class AnthropicChatAgent(BaseAnthropicVertexChatAgent):
    """
    Anthropic-specific customizations
    """
    @staticmethod
    def _parse_model_chunk(chunk_content: list) -> str:
        if len(chunk_content) > 0:
            if "text" in chunk_content[0]:
                return chunk_content[0]["text"]
            elif "partial_json" in chunk_content[0]:
                return chunk_content[0]["partial_json"]
        return ""
