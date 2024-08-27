'use strict';

process.on('uncaughtException', console.error).on('unhandledRejection', console.error);

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { fetchAllAirbyteJobs } from 'airbyte/api';
import * as db from 'db/index';
import { migrate } from 'db/migrate';
import debug from 'debug';
import * as redis from 'lib/redis/redis';
const log = debug('sync-server:main');

/*
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
*/

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
		const allJobs = fetchAllAirbyteJobs();
		await new Promise(res => setTimeout(res, 60000));
	}
}

main();
