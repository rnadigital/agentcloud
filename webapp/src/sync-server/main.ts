'use strict';

process.on('uncaughtException', console.error).on('unhandledRejection', console.error);

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import * as db from 'db/index';
import { migrate } from 'db/migrate';
import debug from 'debug';
import * as redis from 'lib/redis/redis';
const log = debug('sync-server:main');
import { vectorLimitTaskQueue } from 'queue/bull';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';

async function fetchJobList() {
	const combinedJobList = [];
	const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
	const jobBody = {
		jobType: 'sync',
		limit: 100
	};
	let hasMore = true;
	while (hasMore) {
		const jobsRes = await jobsApi.listJobs(jobBody).then(res => res.data);
		console.log('jobsRes', jobsRes);
	}
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
		await new Promise(res => setTimeout(res, 10000));
	}
}

main();
