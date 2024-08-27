'use strict';

process.on('uncaughtException', console.error).on('unhandledRejection', console.error);

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import * as db from 'db/index';
import { migrate } from 'db/migrate';
import debug from 'debug';
import * as redis from 'lib/redis/redis';
const log = debug('sync-server:main');
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import { ListJobsBody } from 'struct/datasource';
/* Limit the max number of loops in the fetchJobsList in case of an issue, to prevent an endless loop.
   This would allow 10,000 jobs which should be enough for now. */
const MAX_ITERATIONS = 100;

async function fetchJobList() {
	const combinedJobList = [];
	const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
	const listJobsBody: ListJobsBody = {
		jobType: 'sync',
		limit: 100,
		offset: 0
		// NOTE: This will cause issues for jobs that quickly complete, or jobs that have a bytes synced in pending or incomplete state
		// status: 'running'
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

	//augment jobs with the actual "connection" and associated datasource from mongo by datasource ID
	// const connectionAddedJobs = await Promise.all(combinedJobList.map(async j => {
	//
	// }));

	// await vectorLimitTaskQueue.add(
	// 	'sync',
	// 	{
	// 		data: 'test'
	// 	},
	// 	{ removeOnComplete: true, removeOnFail: true }
	// );
}

async function main() {
	await db.connect();
	await migrate();
	const gracefulStop = () => {
		log('SIGINT SIGNAL RECEIVED');
		db.client().close();
		redis.close();
		process.exit(0);
	};
	process.on('SIGINT', gracefulStop);
	process.on('message', message => message === 'shutdown' && gracefulStop());
	if (typeof process.send === 'function') {
		log('SENT READY SIGNAL TO PM2');
		process.send('ready');
	}

	// start a loop to fetch all jobs and submit to queue every x seconds
	while (true) {
		fetchJobList();
		await new Promise(res => setTimeout(res, 60000));
	}
}

main();
