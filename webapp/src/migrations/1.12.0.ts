import debug from 'debug';
import { CollectionName } from 'lib/struct/db';
import { ObjectId } from 'mongodb';
import { ToolType } from 'struct/tool';
const log = debug('webapp:migration:1.12.0');

export default async function (db) {
	log('Add new builtin firecrawl html scraper tool to tools db');

	//add the new tool into the db with no teamId or orgId (that should default it to every org and team as an option to add)
	await db.collection('tools').insertOne({
		_id: new ObjectId(),
		name: 'Firecrawl Loader',
		description: 'This tool takes a url and parses the page for all text content',
		type: ToolType.BUILTIN_TOOL, // Corresponds to ToolType.BUILTIN_TOOL
		data: {
			name: 'firecrawl_loader',
			description: 'This tool takes a url and parses the page for all text content',
			apiKey: '',
			parameters: {
				type: 'object',
				required: ['query'],
				properties: {
					query: {
						type: 'string',
						description: 'The url of the website to parse'
					}
				}
			},
			builtin: true
		},
		requiredParameters: {
			required: ['api_key'],
			properties: {
				api_key: {
					type: 'string',
					description: 'The API key required for the tool'
				}
			}
		}
	});
}
