'use strict';

import { getAirbyteAuthToken } from "airbyte/api";

//TODO: can we download this json or will it change? Will it break things?
export default async function getConnectors() {
	return fetch(
		'https://connectors.airbyte.com/files/generated_reports/connector_registry_report.json'
	).then(res => res.json());
}

export async function getConnectorSpecification(sourceDefinitionId: string) {
	let schema;
	try {
		const body = {
			workspaceId: process.env.AIRBYTE_ADMIN_WORKSPACE_ID,
			sourceDefinitionId: sourceDefinitionId
		};
		console.log('body', body)
		const res = await fetch(
			`${process.env.AIRBYTE_WEB_URL}/api/v1/source_definition_specifications/get`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${await getAirbyteAuthToken()}`
				},
				body: JSON.stringify(body)
			}
		);
		schema = await res.json();
		console.log('schema', JSON.stringify(schema, null, 2));
		if (schema.connectionSpecification) {
			schema.connectionSpecification.$schema = 'http://json-schema.org/draft-07/schema#';
		}
	} catch (e) {
		console.error(e);
		schema = null;
	}
	return {
		schema
	};
}
