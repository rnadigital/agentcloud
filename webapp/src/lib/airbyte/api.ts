'use strict';

import { OpenAPIClientAxios } from 'openapi-client-axios';

export enum AirbyteApiType {
	WORKSPACES,
	SOURCES,
	DESTINATIONS,
	CONNECTIONS,
	JOBS
}

const definitions: Record<AirbyteApiType, string> = {
	[AirbyteApiType.WORKSPACES]: 'https://dash.readme.com/api/v1/api-registry/7zfp2qlw5h9pzc',
	[AirbyteApiType.SOURCES]: 'https://dash.readme.com/api/v1/api-registry/1phak1ulrl7djj4',
	[AirbyteApiType.DESTINATIONS]: 'https://dash.readme.com/api/v1/api-registry/byhtdl1jlt91i5p4',
	[AirbyteApiType.CONNECTIONS]: 'https://dash.readme.com/api/v1/api-registry/ggq35loywl8vx',
	[AirbyteApiType.JOBS]: 'https://dash.readme.com/api/v1/api-registry/dld83bfloywkuu9'
};

const apiCache: Partial<Record<AirbyteApiType, any>> = {};

const base64Credentials = Buffer.from(
	`${process.env.AIRBYTE_USERNAME.trim()}:${process.env.AIRBYTE_PASSWORD.trim()}`
).toString('base64');
const axiosConfigDefaults = {
	headers: {
		authorization: `Basic ${base64Credentials}`
	}
};

async function getAirbyteApi(type: AirbyteApiType) {
	if (apiCache[type]) {
		return apiCache[type];
	}
	const api = new OpenAPIClientAxios({
		definition: definitions[type],
		axiosConfigDefaults
	});
	const client = await api.init();
	client.defaults.baseURL = `${process.env.AIRBYTE_WEB_URL}/api/public/v1/`;
	return (apiCache[type] = client);
}

export default getAirbyteApi;
