from typing import Dict, AsyncIterator

import cohere
import httpx
from cohere import Client, AsyncClient, StreamedChatResponse, ClientEnvironment
from cohere.base_client import _get_base_url
from cohere.core import ApiError, AsyncClientWrapper
from langchain_cohere import ChatCohere
from langchain_core.utils import convert_to_secret_str, get_from_dict_or_env
from pydantic.v1 import root_validator


class CustomAsyncClient(AsyncClient):
    """
    Customized to work with the multi-threading implementation in our crewAI fork
    """
    def __init__(self, *args, **kwargs):
        self.environment = ClientEnvironment.PRODUCTION
        self.base_url = _get_base_url(base_url=kwargs['base_url'], environment=self.environment)
        self.client_name = kwargs.get('client_name')
        self.token = kwargs.get('api_key')
        self.timeout = kwargs.get('timeout', 300)
        self.follow_redirects = kwargs.get('follow_redirects')
        super().__init__(*args, **kwargs)

    async def chat_stream(self, *args, **kwargs) -> AsyncIterator[StreamedChatResponse]:
        _defaulted_timeout = self.timeout if self.timeout is not None else 300

        # re-instantiate _client_wrapper everytime
        self._client_wrapper = AsyncClientWrapper(
            base_url=self.base_url,
            client_name=self.client_name,
            token=self.token,
            httpx_client=httpx.AsyncClient(timeout=_defaulted_timeout,
                                           follow_redirects=self.follow_redirects if self.follow_redirects else False),
            timeout=_defaulted_timeout
        )
        async for x in super().chat_stream(*args, **kwargs):
            yield x


class CustomChatCohere(ChatCohere):
    """
    Overrides ChatCohere to set CustomAsyncClient as async_client
    """
    @root_validator()
    def validate_environment(cls, values: Dict) -> Dict:
        values["cohere_api_key"] = convert_to_secret_str(
            get_from_dict_or_env(values, "cohere_api_key", "COHERE_API_KEY")
        )
        client_name = values["user_agent"]
        timeout_seconds = values.get("timeout_seconds")
        values["client"] = cohere.Client(
            api_key=values["cohere_api_key"].get_secret_value(),
            timeout=timeout_seconds,
            client_name=client_name,
            base_url=values["base_url"],
        )
        values["async_client"] = CustomAsyncClient(
            api_key=values["cohere_api_key"].get_secret_value(),
            timeout=timeout_seconds,
            client_name=client_name,
            base_url=values["base_url"],
        )
        return values

