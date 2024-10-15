import debug from 'debug';
import { CollectionName } from 'lib/struct/db';
import { ObjectId } from 'mongodb';
const log = debug('webapp:migration:1.12.0');

export default async function (db) {
	log('Add new builtin firecrawl html scraper tool to each team');

	// Define the new tool object
	const newTool = {
		name: 'Firecrawl Loader',
		description: 'This tool takes a url and parses the page for all text content',
		type: 'builtin', // Corresponds to ToolType.BUILTIN_TOOL
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
	};

	// Fetch all teams
	const teams = await db.collection('teams').find({}).toArray();

	// Insert the new tool for each team
	for (const team of teams) {
		await db.collection('tools').insertOne({
			...newTool,
			_id: new ObjectId(),
			orgId: team.orgId,
			teamId: team._id
		});
	}
}
