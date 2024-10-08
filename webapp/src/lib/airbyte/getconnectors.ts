'use strict';

import getAirbyteInternalApi from './internal';

//TODO: can we download this json or will it change? Will it break things?
export default async function getConnectors() {
	return fetch(
		'https://connectors.airbyte.com/files/generated_reports/connector_registry_report.json'
	).then(res => res.json());
}

export async function getConnectorSpecification(sourceDefinitionId: string) {
	const internalApi = await getAirbyteInternalApi();
	const getSourceDefinitionSpecificationBody = {
		workspaceId: process.env.AIRBYTE_ADMIN_WORKSPACE_ID,
		sourceDefinitionId: sourceDefinitionId
	};
	const sourceDefinitionRes = await internalApi
		.getSourceDefinitionSpecification(null, getSourceDefinitionSpecificationBody)
		.then(res => res.data);
	if (sourceDefinitionRes.connectionSpecification) {
		sourceDefinitionRes.connectionSpecification.$schema = 'http://json-schema.org/draft-07/schema#';
	}
	return {
		schema: sourceDefinitionRes
	};
}
