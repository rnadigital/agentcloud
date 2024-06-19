'use strict';

import {Tool, ToolType} from 'struct/tool';

const GlobalTools: Tool[] = [
	{
		name: 'Get papers from arXiv',
		description: `This function takes a string query as input and fetches related research papers from the arXiv repository.
The function connects to the arXiv API, submits the query, and retrieves a list of papers matching the query criteria.
The returned data includes essential details like the paper's title, authors, abstract, and arXiv ID.`,
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
	},
	{
		name: 'Search Wikipedia',
		description: 'This tool takes a string query as input and fetches relevant pages from Wikipedia.',
		type: ToolType.FUNCTION_TOOL,
		data: {
			name: 'search_wikipedia',
			description: 'This tool takes a string query as input and fetches relevant pages from Wikipedia.',
			code: '',
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {
					query: {
						type: 'string',
						description: 'The query to send to wikipedia to search for pages with.'
					}
				}
			},
			builtin: true
		}
	},
	{
		name: 'Search Wikidata',
		description: 'This tool takes a string query as input and fetches relevant data from Wikidata.',
		type: ToolType.FUNCTION_TOOL,
		data: {
			code: '',
			name: 'search_wikidata',
			description: 'This tool takes a string query as input and fetches relevant data from Wikidata.',
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {query: {type: 'string', description: 'The search query to send to Wikidata'}}
			},
			builtin: true
		}
	},
	{
		name: 'Search DuckDuckGo',
		description: 'This tool takes a string query as input and fetches relevant data from DuckDuckGo.',
		type: ToolType.FUNCTION_TOOL,
		data: {
			code: '',
			name: 'search_duckduckgo',
			description: 'This tool takes a string query as input and fetches relevant data from DuckDuckGo.',
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {query: {type: 'string', description: 'The search query to send to DuckDuckGo'}}
			},
			builtin: true
		}
	},
	{
		name: 'Search StackExchange',
		description: 'This tool takes a string query as input and fetches relevant data from StackExchange.',
		type: ToolType.FUNCTION_TOOL,
		data: {
			code: '',
			name: 'search_stackexchange',
			description: 'This tool takes a string query as input and fetches relevant data from StackExchange.',
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {query: {type: 'string', description: 'The search query to send to StackExchange'}}
			},
			builtin: true
		}
	},
	{
		name: 'Search YouTube',
		description: 'This tool takes a string query as input and fetches relevant data from YouTube.',
		type: ToolType.FUNCTION_TOOL,
		data: {
			code: '',
			name: 'search_youtube',
			description: 'This tool takes a string query as input and fetches relevant data from YouTube.',
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {query: {type: 'string', description: 'The search query to send to YouTube'}}
			},
			builtin: true
		}
	},
	{
		name: 'Search Tavily',
		description: 'This tool takes a string query as input and fetches relevant data from YouTube.',
		type: ToolType.FUNCTION_TOOL,
		data: {
			code: '',
			name: 'search_youtube',
			description: 'This tool takes a string query as input and fetches relevant data from YouTube.',
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {query: {type: 'string', description: 'The search query to send to YouTube'}}
			},
			builtin: true
		}
	}
].map((t: Tool) => {
	t.data.builtin = true;
	return t;
});

export default GlobalTools;
