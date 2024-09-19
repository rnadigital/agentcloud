import logging

from models.vectordatabase import VectorDatabase
from init.env_variables import VECTOR_DATABASE

def vectorstore_factory(embedding_model, collection_name, tool):
    match VECTOR_DATABASE:
        case VectorDatabase.Qdrant:
            from init.env_variables import QDRANT_HOST
            from langchain_community.vectorstores.qdrant import Qdrant
            from qdrant_client import QdrantClient

            # Monkey patch langchain_qdrant to not pass vector_name kwargs when unnecessary
            from langchain_community.query_constructors.qdrant import QdrantTranslator
            from langchain.chains.query_constructor.ir import (
                Comparator,
            )
            from langchain_community.vectorstores.qdrant import Qdrant
            from qdrant_client import QdrantClient
            from qdrant_client.http.api_client import ApiClient, AsyncApiClient
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
                    kwargs.pop('filter')
                cls._client = Client(**kwargs)
            ApiClient.__init__ = custom_init
            def a_custom_imit(self, host: str = None, **kwargs: Any) -> None:
                self.host = host
                self.middleware: AsyncMiddlewareT = BaseAsyncMiddleware()
                if 'vector_name' in kwargs:
                    kwargs.pop('vector_name')
                    kwargs.pop('filter')
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

            # Create qdrant filters from tool ragFilters
            from tools.retrievers.filters import create_qdrant_filters
            my_filters = create_qdrant_filters(tool.ragFilters)

            # Monkey patch similarity_search_with_score_by_vector to inject our filters
            from typing import List, Optional, Tuple, Dict, Union
            from qdrant_client.conversions import common_types
            DictFilter = Dict[str, Union[str, int, bool, dict, list]]
            MetadataFilter = Union[DictFilter, common_types.Filter]
            def similarity_search_with_score_by_vector_with_filter(
                self,
                embedding: List[float],
                k: int = 4,
                filter: Optional[MetadataFilter] = None, # NOTE: unused
                search_params: Optional[common_types.SearchParams] = None,
                offset: int = 0,
                score_threshold: Optional[float] = None,
                consistency: Optional[common_types.ReadConsistency] = None,
                **kwargs: Any,
            ) -> List[Tuple[Document, float]]:
                query_vector = embedding
                if self.vector_name is not None:
                    query_vector = (self.vector_name, embedding)  # type: ignore[assignment]
                results = self.client.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    query_filter=my_filters,
                    search_params=search_params,
                    limit=k,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False,  # Langchain does not expect vectors to be returned
                    score_threshold=score_threshold,
                    consistency=consistency,
                    **kwargs,
                )
                return [
                    (
                        self._document_from_scored_point(
                            result,
                            self.collection_name,
                            self.content_payload_key,
                            self.metadata_payload_key,
                        ),
                        result.score,
                    )
                    for result in results
                ]
            Qdrant.similarity_search_with_score_by_vector = similarity_search_with_score_by_vector_with_filter

            return Qdrant.from_existing_collection(
                embedding=embedding_model,
                path=None,
                collection_name=collection_name,
                # vector_name=embedding_model.model,
                url=QDRANT_HOST
            )
        case VectorDatabase.Pinecone:

            from langchain_community.vectorstores.pinecone import Pinecone
            from typing import List, Optional, Tuple, Dict, Union
            from langchain_community.docstore.document import Document
            from tools.retrievers.filters import create_pinecone_filters
            my_filters = create_pinecone_filters(tool.ragFilters)
            def similarity_search_by_vector_with_score_with_filter(
                self,
                embedding: List[float],
                *,
                k: int = 4,
                filter: Optional[dict] = None,
                namespace: Optional[str] = None,
            ) -> List[Tuple[Document, float]]:
                """Return pinecone documents most similar to embedding, along with scores."""

                if namespace is None:
                    namespace = self._namespace
                docs = []
                results = self._index.query(
                    vector=[embedding],
                    top_k=k,
                    include_metadata=True,
                    namespace=namespace,
                    filter=my_filters,
                )
                for res in results["matches"]:
                    metadata = res["metadata"]
                    if self._text_key in metadata:
                        text = metadata.pop(self._text_key)
                        score = res["score"]
                        docs.append((Document(page_content=text, metadata=metadata), score))
                    else:
                        logger.warning(
                            f"Found document with no `{self._text_key}` key. Skipping."
                        )
                return docs

            Pinecone.similarity_search_by_vector_with_score = similarity_search_by_vector_with_score_with_filter
            return Pinecone.from_existing_index(
                index_name="us-central1", #TODO: make customisable
                embedding=embedding_model,
                text_key="page_content", #TODO: check
                namespace=collection_name,
            )
