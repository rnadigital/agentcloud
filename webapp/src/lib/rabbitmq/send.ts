'use strict';

import { Channel, connect,Connection } from 'amqplib';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

let connection: Connection | null = null
	, channel: Channel | null = null;

export async function initRabbit() {
	connection = await connect(`amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`);
	channel = await connection.createChannel();
	await channel.assertExchange('streaming', 'direct', { durable: true });
}

export async function sendMessage(message: string, metadata: any) {
	try {
		channel.publish('streaming', 'key', Buffer.from(message), { headers: metadata });
	} catch (error) {
		console.error('Error in sending message:', error);
	}
};
