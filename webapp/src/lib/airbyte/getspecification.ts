'use strict';

import debug from 'debug';
const log = debug('webapp:airbyte:getSpecification');

export default async function getSpecification(req, res, _next) {
	const base64Credentials = Buffer.from(`${process.env.AIRBYTE_USERNAME}:${process.env.AIRBYTE_PASSWORD}`).toString('base64');
	let schema;
	try {
		const body = {
			workspaceId: process.env.AIRBYTE_ADMIN_WORKSPACE_ID,
			sourceDefinitionId: req.query.sourceDefinitionId,
		};
		log(body);
		const res = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/v1/source_definition_specifications/get`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Basic ${base64Credentials}`,
			},
			body: JSON.stringify(body),
		});
		schema = await res.json();
		log(schema);
	} catch (e) {
		console.error(e);
		schema = null;
	}
	return {
		csrf: req.csrfToken(),
		schema,
	};
}
