import { Queue, Worker } from 'bullmq';

import { client as redisClient } from '../../redis';

export const taskQueue = new Queue('task_queue', {
	connection: redisClient
	/*{
		host: process.env.REDIS_HOST || '127.0.0.1',
		port: parseInt(process.env.REDIS_PORT) || 6379,
		password: process.env.REDIS_PASS || '',
	}*/
});
