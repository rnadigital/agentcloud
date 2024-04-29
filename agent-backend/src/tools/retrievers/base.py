from abc import ABC, abstractmethod


class BaseToolRetriever(ABC):

    def run(self, query):
        # Perform the query and get results
        results = self.perform_query(query)
        print(f"RAG query results: {results}")
        if not results or len(results) == 0:
            return f"NO RESULTS FOUND IN DATASOURCE \"{self.tool.name}\" FOR QUERY: \"{query}\""
        formatted_results = self.format_results(results)
        print(f"RAG formatted response: {formatted_results}")
        return formatted_results

    def perform_query(self, query):
        # This method should be overridden by subclasses to perform the actual query
        raise NotImplementedError

    def format_results(self, results):
        # This method should be overridden by subclasses to format the results
        raise NotImplementedError
