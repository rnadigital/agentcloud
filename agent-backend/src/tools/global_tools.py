def get_papers_from_arvix(query: str) -> list:
    try:
        import arxiv
        search = arxiv.Search(
            query=query,
            max_results=10,
            sort_by=arxiv.SortCriterion.SubmittedDate
        )
        results = []
        for result in arxiv.Client().results(search):
            results.append(result.title)
        return results
    except Exception as e:
        print(f"An error occurred: {str(e)}")
