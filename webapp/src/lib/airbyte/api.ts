'use strict';

import debug from 'debug';
import { OpenAPIClientAxios } from 'openapi-client-axios';
import { ListJobsBody } from 'struct/datasource';
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
	[AirbyteApiType.WORKSPACES]: 'https://dash.readme.com/api/v1/api-registry/16o35loywijq5',
	[AirbyteApiType.SOURCES]: 'https://dash.readme.com/api/v1/api-registry/18dnz3hlp380w3x',
	[AirbyteApiType.DESTINATIONS]: 'https://dash.readme.com/api/v1/api-registry/im2uloyyk7wt',
	[AirbyteApiType.CONNECTIONS]: 'https://dash.readme.com/api/v1/api-registry/ggq35loywl8vx',
	[AirbyteApiType.JOBS]: 'https://dash.readme.com/api/v1/api-registry/dld83bfloywkuu9',
	[AirbyteApiType.STREAMS]: 'https://dash.readme.com/api/v1/api-registry/2761llw9jxqam'
};

const apiCache: Partial<Record<AirbyteApiType, any>> = {};

const base64Credentials = Buffer.from(
	`${process.env.AIRBYTE_USERNAME}:${process.env.AIRBYTE_PASSWORD}`
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
	client.defaults.baseURL = `${process.env.AIRBYTE_WEB_URL}/api/public/v1`;
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
		// if the response had a "next" property, which is a URL like 'airbyte-server:8001/api/public/v1/jobs?limit=100&offset=100'
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
