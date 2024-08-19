'use strict';

import debug from 'debug';
import { OpenAPIClientAxios } from 'openapi-client-axios';
import { expire, get, set } from 'redis/redis';
const log = debug('webapp:airbyte:api');
const CACHE_KEY = 'airbyte_access_token';

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

export async function getAirbyteAuthToken() {
	// Check if the token is already cached
	let token = await get(CACHE_KEY);
	if (token) {
		log('Returning cached Airbyte auth token:', token);
		return token;
	}
	log('Token not found in cache, fetching new token...');
	return fetch(`${process.env.AIRBYTE_WEB_URL}/api/public/v1/applications/token`, {
		method: 'POST',
		headers: {
			authorization: `Basic ${base64Credentials}`,
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			client_id: process.env.AIRBYTE_CLIENT_ID,
			client_secret: process.env.AIRBYTE_CLIENT_SECRET
		})
	})
		.then(res => res.json())
		.then(async json => {
			log('getAirbyteAuthToken json:', json);
			const token = json?.access_token || '';
			if (token) {
				await set(CACHE_KEY, token, 60);
				log('Token cached for 60 seconds.');
			}
			return token;
		});
}

async function getAirbyteApi(type: AirbyteApiType) {
	if (apiCache[type]) {
		apiCache[type].defaults.headers = {
			authorization: `Bearer ${await getAirbyteAuthToken()}`
		};
		return apiCache[type];
	}
	const api = new OpenAPIClientAxios({
		definition: definitions[type],
		axiosConfigDefaults: {
			headers: {
				authorization: `Bearer ${await getAirbyteAuthToken()}`
			}
		}
	});
	const client = await api.init();
	client.defaults.baseURL = `${process.env.AIRBYTE_WEB_URL}/api/public/v1/`;
	return (apiCache[type] = client);
}

export default getAirbyteApi;
