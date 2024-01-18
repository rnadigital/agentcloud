def get_papers_from_arxiv(query: str) -> list:
    try:
        import arxiv

        search = arxiv.Search(
            query=query, max_results=10, sort_by=arxiv.SortCriterion.SubmittedDate
        )
        results = []
        for result in arxiv.Client().results(search):
            results.append(result.title)
        return results
    except Exception as e:
        print(f"An error occurred: {str(e)}")


def openapi_request(**kwargs):
    try:
        import requests

        base_url = kwargs.get("__baseurl")
        endpoint = kwargs.get("__path")
        request_method = getattr(requests, kwargs.get("__method"))
        kwargs.pop("__baseurl")
        kwargs.pop("__path")
        kwargs.pop("__method")
        response = request_method(base_url + endpoint, params=kwargs)
        if response.status_code == 200:
            return response.json()
        else:
            return None
    except Exception as e:
        print(f"An error occurred: {str(e)}")
