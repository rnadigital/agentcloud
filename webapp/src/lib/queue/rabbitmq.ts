import { Channel, connect, Connection } from 'amqplib';
import debug from 'debug';
import dotenv from 'dotenv';
import MessageQueueProvider from 'queue/provider';

dotenv.config({ path: '.env' });

const log = debug('webapp:queue:rabbitmq');

class RabbitMQProvider extends MessageQueueProvider {
	#connection: Connection | null = null;
	#channel: Channel | null = null;

	constructor() {
		super();
	}

	async init() {
		try {
			this.#connection = await connect(`amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`);
			this.#channel = await this.#connection.createChannel();
			await this.#channel.assertExchange(process.env.QUEUE_NAME, 'direct', { durable: true });
			log('RabbitMQ connection and channel established.');
		} catch (error) {
			log(`Failed to initialize RabbitMQ: ${error.message}`);
			throw error;
		}
	}

	async sendMessage(message: string, metadata: any) {
		log({ message, metadata });
		try {
			await this.#channel?.publish('agentcloud', 'key', Buffer.from(message), { headers: metadata });
			log('Message sent successfully.');
		} catch (error) {
			log(`Error in sending message: ${error.message}`);
			throw error;
		}
	}
}

export default new RabbitMQProvider();
