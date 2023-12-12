'use strict';

import { Document, OpenAPIClientAxios } from 'openapi-client-axios';

export enum AirbyteApiType {
	WORKSPACES,
	SOURCES,
	DESTINATIONS,
	CONNECTIONS,
	JOBS,
}

const definitions: Record<AirbyteApiType,string> = {
	[AirbyteApiType.WORKSPACES]: 'https://dash.readme.com/api/v1/api-registry/16o35loywijq5',
	[AirbyteApiType.SOURCES]: 'https://dash.readme.com/api/v1/api-registry/18dnz3hlp380w3x',
	[AirbyteApiType.DESTINATIONS]: 'https://dash.readme.com/api/v1/api-registry/im2uloyyk7wt',
	[AirbyteApiType.CONNECTIONS]: 'https://dash.readme.com/api/v1/api-registry/ggq35loywl8vx',
	[AirbyteApiType.JOBS]: 'https://dash.readme.com/api/v1/api-registry/dld83bfloywkuu9',
};

const apiCache: Partial<Record<AirbyteApiType,any>> = {};

const base64Credentials = Buffer.from(`${process.env.AIRBYTE_USERNAME}:${process.env.AIRBYTE_PASSWORD}`).toString('base64');
const axiosConfigDefaults = {
	headers: {
		'authorization': `Basic ${base64Credentials}`,
	},
};

async function getAirbyteApi(type: AirbyteApiType) {
	if (apiCache[type]) {
		return apiCache[type];
	}
	const api = new OpenAPIClientAxios({
		definition: definitions[type],
		axiosConfigDefaults,
	});
	const client = await api.init();
	client.defaults.baseURL = `${process.env.AIRBYTE_API_URL}/v1`;
	return apiCache[type] = client;
}

export default getAirbyteApi;
