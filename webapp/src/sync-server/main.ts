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

async function fetchJobList() {
	const combinedJobList = [];
	const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
	const listJobsBody: ListJobsBody = {
		// jobType: 'sync',
		limit: 100,
		offset: 0,
		// status: 'running' // Note: Will this cause issues for jobs that quickly complete that cause limits to be exceeded?
	};
	let hasMore = true;
	while (hasMore) {
		console.log(listJobsBody);
		const jobsRes = await jobsApi.listJobs(listJobsBody).then(res => res.data);
		console.log('jobsRes', jobsRes);
		// Push all jobs to combinedJobList
		combinedJobList.push(...jobsRes.data);
		if (!jobsRes?.next) {
			hasMore = false;
			break;
		}
		let newOffset;
		try {
			const offsetUrl = new URL(jobsRes.next);
			newOffset = offsetUrl?.searchParams?.get('offset');
		} catch (e) {
			log(e);
		}
		if (newOffset) {
			listJobsBody.offset = newOffset;
		}
	}
	log('combinedJobList', combinedJobList);
	// await vectorLimitTaskQueue.add(
	// 	'sync',
	// 	{
	// 		data: 'test'
	// 	},
	// 	{ removeOnComplete: true, removeOnFail: true }
	// );
}

async function main() {
	log('main');
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
	while (true) {
		fetchJobList();
		await new Promise(res => setTimeout(res, 3000));
	}
}

main();
