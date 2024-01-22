'use strict';

export default async function getSpecification(req, res, _next) {
	const base64Credentials = Buffer.from(`${process.env.AIRBYTE_USERNAME}:${process.env.AIRBYTE_PASSWORD}`).toString('base64');
	let schema;
	try {
		const res = await fetch(`${process.env.AIRBYTE_WEB_URL}/api/v1/source_definition_specifications/get`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Basic ${base64Credentials}`,
			},
			body: JSON.stringify({
				workspaceId: process.env.AIRBYTE_ADMIN_WORKSPACE_ID,
				sourceDefinitionId: req.query.sourceDefinitionId,
			})
		});
		schema = await res.json();
	} catch (e) {
		console.error(e);
		schema = null;
	}
	return {
		csrf: req.csrfToken(),
		schema,
	};
}
