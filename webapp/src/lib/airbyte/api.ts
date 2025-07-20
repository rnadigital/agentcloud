'use strict';

import debug from 'debug';
import { OpenAPIClientAxios } from 'openapi-client-axios';
import { expire, get, set } from 'redis/redis';
const CACHE_KEY = 'airbyte_access_token';
import { ListJobsBody } from 'struct/syncserver';
const log = debug('airbyte:public-api');

export enum AirbyteApiType {
	WORKSPACES,
	SOURCES,
	DESTINATIONS,
	CONNECTIONS,
	JOBS,
	STREAMS
}

const definitions: Record<AirbyteApiType, string> = {
	[AirbyteApiType.WORKSPACES]: 'https://dash.readme.com/api/v1/api-registry/7zfp2qlw5h9pzc',
	[AirbyteApiType.SOURCES]: 'https://dash.readme.com/api/v1/api-registry/1phak1ulrl7djj4',
	[AirbyteApiType.DESTINATIONS]: 'https://dash.readme.com/api/v1/api-registry/byhtdl1jlt91i5p4',
	[AirbyteApiType.CONNECTIONS]: 'https://dash.readme.com/api/v1/api-registry/ggq35loywl8vx',
	[AirbyteApiType.JOBS]: 'https://dash.readme.com/api/v1/api-registry/dld83bfloywkuu9',
	[AirbyteApiType.STREAMS]: 'https://dash.readme.com/api/v1/api-registry/2761llw9jxqam'
};

const apiCache: Partial<Record<AirbyteApiType, any>> = {};

export async function getAirbyteAuthToken() {
	// Check if the token is already cached
	let token = await get(CACHE_KEY);
	if (token) {
		log('Returning cached Airbyte auth token:', token);
		return token;
	}
	log('Token not found in cache, fetching new token...');
	return fetch(
		`${process.env.AIRBYTE_WEB_URL}${process.env.AIRBYTE_WEB_URL === 'https://api.airbyte.com' ? '' : '/api'}/v1/applications/token`,
		{
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				client_id: process.env.AIRBYTE_CLIENT_ID,
				client_secret: process.env.AIRBYTE_CLIENT_SECRET,
				grant: 'client_credentials'
			})
		}
	)
		.then(res => res.json())
		.then(async json => {
			log('getAirbyteAuthToken json:', JSON.stringify(json, null, 2));
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
			// authorization: `Bearer ${await getAirbyteAuthToken()}`
		};
		return apiCache[type];
	}
	const api = new OpenAPIClientAxios({
		definition: definitions[type],
		axiosConfigDefaults: {
			headers: {
				// authorization: `Bearer ${await getAirbyteAuthToken()}`
			}
		}
	});
	const client = await api.init();
	if (process.env.AIRBYTE_WEB_URL !== 'https://api.airbyte.com') {
		client.defaults.baseURL = `${process.env.AIRBYTE_WEB_URL}/api/public/v1`;
	}
	return (apiCache[type] = client);
}

/* Limit the max number of loops in the fetchJobsList in case of an issue, to prevent an endless loop.
   This would allow 10,000 jobs which should be enough for now. */
const MAX_ITERATIONS = 100;
//Utility function to get all airbyte jobs
export async function fetchAllAirbyteJobs(options?: Partial<ListJobsBody>) {
	const combinedJobList = [];
	const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
	const listJobsBody: ListJobsBody = {
		jobType: 'sync',
		limit: 100,
		offset: 0,
		// NOTE: This will cause issues for jobs that quickly complete, or jobs that have a bytes synced in pending or incomplete state
		status: 'running', //Note: commented out for testing
		...options
	};

	//NOTE: because airbytes "next" doesn't use an ID, it's possible this will miss or duplicate some jobs.
	let hasMore = true;
	let currentIteration = 0;
	while (hasMore && currentIteration < MAX_ITERATIONS) {
		currentIteration++;
		// fetch some jobs
		const jobsRes = await jobsApi.listJobs(listJobsBody).then(res => res.data);
		// push them to the combined list
		combinedJobList.push(...jobsRes.data);
		if (!jobsRes?.next) {
			hasMore = false;
			break;
		}
		// if the response had a "next" property, which is a URL like '/api/public/v1/jobs?limit=100&offset=100'
		let newOffset;
		try {
			// convert to a url and extract the "offset" query string parameter
			const offsetUrl = new URL(jobsRes.next);
			newOffset = offsetUrl?.searchParams?.get('offset');
		} catch (e) {
			log(e);
		}
		// if an offset was able to be extracted from the URL, set it in the body for the next request
		if (newOffset) {
			listJobsBody.offset = newOffset;
		}
	}
	log('combinedJobList', combinedJobList);
	return combinedJobList;
}

export default getAirbyteApi;
