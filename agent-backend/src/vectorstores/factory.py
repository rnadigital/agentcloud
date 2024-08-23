import logging

def vectorstore_factory():
    logging.info("vectorstore_factory")
    metadata_field_info = tool.retriever_config.metadata_field_info
    for field in metadata_field_info:
        if isinstance(field.type, list) and 'null' in field.type:
            field.type = [t for t in field.type if t != 'null'][0]
    match tool.retriever_type:
        case Retriever.RAW:
            return DefaultRetriever(tool, embedding, vector_store)
        case Retriever.SELF_QUERY:
            return SelfQueryRetriever(tool, embedding, llm, vector_store)
        case Retriever.TIME_WEIGHTED:
            return TimeWeightedRetriever(tool, vector_store)
        case Retriever.MULTI_QUERY:
            return MultiQueryRetriever(tool, llm, vector_store)
