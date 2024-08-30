import { Queue, Worker } from 'bullmq';
import { client as redisClient } from 'redis/redis';

export const sessionTaskQueue = new Queue('task_queue', {
	connection: redisClient
});

export const vectorLimitTaskQueue = new Queue('vector_limit_check', {
	connection: redisClient
});

export { Worker };
