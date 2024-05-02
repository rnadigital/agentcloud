import arxiv
from .base import BaseBuiltinTool


class ArxivTool(BaseBuiltinTool):
    """
    get_papers_from_arxiv
    This tool takes a string query as input and fetches related research papers from the arXiv repository.
    The run_tool function connects to the arXiv API, submits the query, and retrieves a list of papers matching the query criteria.
    The returned data includes essential details like the paper's title, authors, abstract, and arXiv ID.
    Args:
        query (str): The query to send to arxiv to search for papers with.
    """

    def run_tool(self, query: str) -> str:
        try:
            self.logger.info(f"{self.__class__.__name__} searching for '{query}'")
            search = arxiv.Search(
                query=query, max_results=10, sort_by=arxiv.SortCriterion.SubmittedDate
            )
            results = []
            for result in arxiv.Client().results(search):
                results.append(result.title)
            return results
        except Exception as e:
            print(f"An error occurred: {str(e)}")
            return f"An error occurred: {str(e)}"
