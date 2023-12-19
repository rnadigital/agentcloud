'use strict';

//TODO: can we download this json or will it change? Will it break things?
export default async function getConnectors() {
	return fetch('https://connectors.airbyte.com/files/generated_reports/connector_registry_report.json')
		.then(res => res.json());
}
