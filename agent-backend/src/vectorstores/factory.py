import logging

from models.vectordatabase import VectorDatabase
from init.env_variables import VECTOR_DATABASE

def vectorstore_factory(embedding_model, collection_name):
    match VECTOR_DATABASE:
        case VectorDatabase.Qdrant:
            from init.env_variables import QDRANT_HOST
            from langchain_community.vectorstores.qdrant import Qdrant
            from qdrant_client import QdrantClient

#########
            from langchain_community.query_constructors.qdrant import QdrantTranslator
            from langchain.chains.query_constructor.ir import (
                Comparator,
            )
            from langchain_community.vectorstores.qdrant import Qdrant
            from qdrant_client import QdrantClient
            from qdrant_client.http.api_client import ApiClient, AsyncApiClient

            # monkey patching langchain_qdrant to not pass vector_name kwargs when unnecessary
            from httpx import AsyncClient, Client, Request, Response
            from typing import Callable, Awaitable, Any
            Send = Callable[[Request], Response]
            SendAsync = Callable[[Request], Awaitable[Response]]
            class BaseAsyncMiddleware:
                async def __call__(self, request: Request, call_next: SendAsync) -> Response:
                    return await call_next(request)
            class BaseMiddleware:
                def __call__(self, request: Request, call_next: Send) -> Response:
                    return call_next(request)
            def custom_init(cls, host: str = None, **kwargs: Any) -> None:
                cls.host = host
                cls.middleware: MiddlewareT = BaseMiddleware()
                if 'vector_name' in kwargs:
                    kwargs.pop('vector_name')
                cls._client = Client(**kwargs)
            ApiClient.__init__ = custom_init
            def a_custom_imit(self, host: str = None, **kwargs: Any) -> None:
                self.host = host
                self.middleware: AsyncMiddlewareT = BaseAsyncMiddleware()
                if 'vector_name' in kwargs:
                    kwargs.pop('vector_name')
                self._async_client = AsyncClient(**kwargs)
            AsyncApiClient.__init__ = a_custom_imit

            # monkey patching langchain for this to work properly with our Qdrant metadata layout (not nested)
            from langchain_community.vectorstores.qdrant import Qdrant
            from langchain_community.docstore.document import Document
            def custom_document_from_scored_point(cls, scored_point, collection_name, content_payload_key, metadata_payload_key):
                metadata = scored_point.payload or {}
                # Check if metadata is a dictionary and handle it appropriately
                if isinstance(metadata, dict):
                    metadata["_id"] = scored_point.id
                    metadata["_collection_name"] = collection_name
                else:
                    metadata = {
                        "_id": scored_point.id,
                        "_collection_name": collection_name,
                        metadata_payload_key: metadata,
                    }
                return Document(
                    page_content=scored_point.payload.get(content_payload_key),
                    metadata=metadata,
                )
            Qdrant._document_from_scored_point = classmethod(custom_document_from_scored_point)
            def custom_visit_comparison(self, comparison):
                try:
                    from qdrant_client.http import models as rest
                except ImportError as e:
                    raise ImportError(
                        "Cannot import qdrant_client. Please install with `pip install qdrant-client`."
                    ) from e
                self._validate_func(comparison.comparator)

                # Use the attribute directly instead of metadata_key + "." + ...
                attribute = comparison.attribute

                if comparison.comparator == Comparator.EQ:
                    return rest.FieldCondition(
                        key=attribute, match=rest.MatchValue(value=comparison.value)
                    )
                elif comparison.comparator == Comparator.LIKE:
                    return rest.FieldCondition(
                        key=attribute, match=rest.MatchText(text=comparison.value)
                    )
                else:
                    kwargs = {comparison.comparator.value: comparison.value}
                    return rest.FieldCondition(key=attribute, range=rest.Range(**kwargs))
            QdrantTranslator.visit_comparison = custom_visit_comparison
#########

            return Qdrant.from_existing_collection(
                embedding=embedding_model,
                path=None,
                collection_name=collection_name,
                vector_name=embedding_model.model,
                url=QDRANT_HOST
            )
        case VectorDatabase.Pinecone:
            return 2