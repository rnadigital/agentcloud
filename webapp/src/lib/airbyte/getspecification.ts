'use strict';

import debug from 'debug';
import { getAirbyteAuthToken } from 'airbyte/api';
const log = debug('webapp:airbyte:getSpecification');

export default async function getSpecification(req, res, _next) {
	let schema;
	try {
		const body = {
			workspaceId: process.env.AIRBYTE_ADMIN_WORKSPACE_ID,
			sourceDefinitionId: req.query.sourceDefinitionId
		};
		log(body);
		const res = await fetch(
			`${process.env.AIRBYTE_WEB_URL}/api/v1/source_definition_specifications/get`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					authorization: `Bearer ${await getAirbyteAuthToken()}`
				},
				body: JSON.stringify(body)
			}
		);
		schema = await res.json();
		if (schema.connectionSpecification) {
			schema.connectionSpecification.$schema = 'http://json-schema.org/draft-07/schema#';
		} else {
			log('getSpecification', JSON.stringify(schema, null, 2));
			throw Error('Failed to fetch connector specification');
		}
	} catch (e) {
		console.error(e);
		schema = null;
	}
	return {
		csrf: req.csrfToken(),
		schema
	};
}
