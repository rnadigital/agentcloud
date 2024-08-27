'use strict';

process.on('uncaughtException', console.error).on('unhandledRejection', console.error);

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import getAirbyteApi, { AirbyteApiType, fetchAllAirbyteJobs } from 'airbyte/api';
import { getDatasourceByConnectionId } from 'db/datasource';
import * as db from 'db/index';
import { migrate } from 'db/migrate';
import debug from 'debug';
import * as redis from 'lib/redis/redis';
const log = debug('sync-server:main');

/*
	// await vectorLimitTaskQueue.add(
	// 	'sync',
	// 	{
	// 		data: 'test'
	// 	},
	// 	{ removeOnComplete: true, removeOnFail: true }
	// );
*/

async function augmentJobs(jobList) {
	const connectionsApi = await getAirbyteApi(AirbyteApiType.CONNECTIONS);
	const augmentedJobs = await Promise.all(
		jobList.map(async job => {
			// fetch and attach the full airbyte "connection" object based on the jobs connectionId
			let foundConnection;
			try {
				foundConnection = await connectionsApi
					.getConnection(job.connectionId)
					.then(res => res.data);
				if (foundConnection) {
					job.connection = foundConnection;
				}
			} catch (e) {
				log(e);
			}

			// fetch and attach the the datasource from mongo based on the jobs connectionId
			let foundDatasource;
			try {
				foundDatasource = await getDatasourceByConnectionId(job.connectionId);
				if (foundDatasource) {
					job.datasource = foundDatasource;
				}
			} catch (e) {
				log(e);
			}

			return job;
		})
	);
	log('augmentedJobs', augmentedJobs);
	return augmentJobs;
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
		const jobList = await fetchAllAirbyteJobs();
		const augmentedJobs = await augmentJobs(jobList);
		await new Promise(res => setTimeout(res, 60000));
	}
}

main();
