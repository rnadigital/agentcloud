import logging
from typing import Dict, Any, Sequence

from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.documents import Document

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class RetrieverCallbackHandler(BaseCallbackHandler):
    def on_retriever_start(
            self,
            serialized: Dict[str, Any],
            query: str,
            **kwargs: Any,
    ) -> None:
        logger.debug(f"on_retriever_start: \n {serialized} \n query => {query} \n args => {kwargs} \n -----")

    def on_retriever_end(
            self,
            documents: Sequence[Document],
            **kwargs: Any,
    ) -> None:
        logger.debug(f"on_retriever_end: \n documents => {documents} \n args => {kwargs} \n -----")

    def on_retriever_error(
            self,
            error: BaseException,
            **kwargs: Any,
    ) -> Any:
        logger.debug(f"on_retriever_error: \n error => {error} \n args => {kwargs} \n -----")

    def on_text(
            self,
            text: str,
            **kwargs: Any,
    ) -> None:
        logger.debug(f"on_text: \n text => {text} \n args => {kwargs} \n -----")
