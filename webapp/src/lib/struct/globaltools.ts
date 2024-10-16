'use strict';

import { Tool, ToolType } from 'struct/tool';

const GlobalTools: Tool[] = [
	{
		name: 'Get papers from arXiv',
		description: `This function takes a string query as input and fetches related research papers from the arXiv repository.
The function connects to the arXiv API, submits the query, and retrieves a list of papers matching the query criteria.
The returned data includes essential details like the paper's title, authors, abstract, and arXiv ID.`,
		type: ToolType.BUILTIN_TOOL,
		data: {
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
		description:
			'This tool takes a string query as input and fetches relevant pages from Wikipedia.',
		type: ToolType.BUILTIN_TOOL,
		data: {
			name: 'search_wikipedia',
			description:
				'This tool takes a string query as input and fetches relevant pages from Wikipedia.',
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
		type: ToolType.BUILTIN_TOOL,
		data: {
			name: 'search_wikidata',
			description:
				'This tool takes a string query as input and fetches relevant data from Wikidata.',
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {
					query: { type: 'string', description: 'The search query to send to Wikidata' }
				}
			},
			builtin: true
		}
	},
	{
		name: 'Search DuckDuckGo',
		description:
			'This tool takes a string query as input and fetches relevant data from DuckDuckGo.',
		type: ToolType.BUILTIN_TOOL,
		data: {
			name: 'search_duckduckgo',
			description:
				'This tool takes a string query as input and fetches relevant data from DuckDuckGo.',
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {
					query: { type: 'string', description: 'The search query to send to DuckDuckGo' }
				}
			},
			builtin: true
		}
	},
	{
		name: 'Search StackExchange',
		description:
			'This tool takes a string query as input and fetches relevant data from StackExchange.',
		type: ToolType.BUILTIN_TOOL,
		data: {
			name: 'search_stackexchange',
			description:
				'This tool takes a string query as input and fetches relevant data from StackExchange.',
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {
					query: { type: 'string', description: 'The search query to send to StackExchange' }
				}
			},
			builtin: true
		}
	},
	{
		name: 'Search YouTube',
		description: 'This tool takes a string query as input and fetches relevant data from YouTube.',
		type: ToolType.BUILTIN_TOOL,
		data: {
			name: 'search_youtube',
			description:
				'This tool takes a string query as input and fetches relevant data from YouTube.',
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {
					query: { type: 'string', description: 'The search query to send to YouTube' }
				}
			},
			builtin: true
		}
	},
	{
		name: 'Search Google (Serper)',
		description: 'This tool takes a string query as input and fetches relevant data from Google.',
		type: ToolType.BUILTIN_TOOL,
		data: {
			name: 'search_google',
			description: 'This tool takes a string query as input and fetches relevant data from Google.',
			apiKey: '',
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {
					query: { type: 'string', description: 'The search query to send to Google' }
				}
			},
			builtin: true
		},
		requiredParameters: {
			required: ['serper_api_key'],
			properties: {
				serper_api_key: { type: 'string', description: 'The search query to send to Google' }
			}
		}
	},
	{
		name: 'Firecrawl Loader',
		description: 'This tool takes a url and parses the page for all text content',
		type: ToolType.BUILTIN_TOOL,
		data: {
			name: 'firecrawl_loader',
			description: 'This tool takes a url and parses the page for all text content',
			apiKey: '',
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {
					query: { type: 'string', description: 'The url of the website to parse' }
				}
			},
			builtin: true
		},
		requiredParameters: {
			required: ['firecrawl_api_key'],
			properties: {
				firecrawl_api_key: { type: 'string', description: 'The url of the website to parse' }
			}
		}
	},
	{
		name: 'Search Google (Apify)',
		description: 'This tool takes a string query as input and fetches results from Google.',
		type: ToolType.BUILTIN_TOOL,
		data: {
			name: 'apify_search_google',
			description: 'This tool takes a string query as input and fetches results from Google.',
			apiKey: '',
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {
					query: { type: 'string', description: 'The search query to send to Google' }
				}
			},
			builtin: true
		},
		requiredParameters: {
			required: ['apify_api_token'],
			properties: {
				apify_api_token: { type: 'string', description: 'The search query to send to Google' }
			}
		}
	}
].map((t: Tool) => {
	t.data.builtin = true;
	return t;
});

export default GlobalTools;
