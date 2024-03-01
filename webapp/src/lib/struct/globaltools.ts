'use strict';

import { Tool, ToolType } from 'struct/tool';

const GlobalTools: Tool[] = [
	{
		name: 'Get papers from arXiv',
		type: ToolType.FUNCTION_TOOL, //TODO: rename this type
		data: {
			code: '', //TODO: not make mandatory in pydantic
			name: 'get_papers_from_arxiv',
			description: `This function takes a string query as input and fetches related research papers from the arXiv repository.
The function connects to the arXiv API, submits the query, and retrieves a list of papers matching the query criteria.
The returned data includes essential details like the paper's title, authors, abstract, and arXiv ID.`,
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {
					query: {
						type: 'string',
						description: 'The query to send to arxiv to search for papers with.'
					}
				}
			}
		}
	}
].map((t: Tool) => {
	t.data.builtin = true;
	return t;
});

export default GlobalTools;
