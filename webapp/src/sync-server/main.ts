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
	log('setInterval');
	setInterval(() => {
		log('add job');
		vectorLimitTaskQueue.add(
			'sync',
			{
				data: 'test'
			},
			{ removeOnComplete: true, removeOnFail: true }
		);
	}, 1000);
}

main();
