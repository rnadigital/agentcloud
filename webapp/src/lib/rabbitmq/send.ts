'use strict';

import { Channel, connect,Connection } from 'amqplib';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import debug from 'debug';
const log = debug('webapp:rabbitmq');

let connection: Connection | null = null
	, channel: Channel | null = null;

export async function initRabbit() {
	console.log('rabbitmq_host: %d', process.env.RABBITMQ_HOST);
	console.log('rabbitmq_port: %d', process.env.RABBITMQ_PORT);
	connection = await connect(`amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`);
	channel = await connection.createChannel();
	await channel.assertExchange('streaming', 'direct', { durable: true });
}

export async function sendMessage(message: string, metadata: any) {
	log({ message, metadata });
	try {
		await channel.publish('agentcloud', 'key', Buffer.from(message), { headers: metadata });
	} catch (error) {
		console.error('Error in sending message:', error);
	}
};
