import { Channel, connect, Connection } from 'amqplib';
import dotenv from 'dotenv';
import MessageQueueProvider from 'queue/provider';
import { createLogger } from 'utils/logger';

dotenv.config({ path: '.env' });

const log = createLogger('webapp:queue:rabbitmq');

class RabbitMQProvider extends MessageQueueProvider {
	#connection: Connection | null = null;
	#channel: Channel | null = null;

	constructor() {
		super();
	}

	async init() {
		try {
			this.#connection = await connect(
				`amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.AIRBYTE_RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`
			);
			this.#channel = await this.#connection.createChannel();
			await this.#channel.assertExchange(process.env.QUEUE_NAME, 'direct', { durable: true });
			log.info('RabbitMQ connection and channel established.');
		} catch (error) {
			log.error(`Failed to initialize RabbitMQ: ${error.message}`);
			throw error;
		}
	}

	async sendMessage(message: string, metadata: any) {
		log.info('message %O', message);
		log.info('metadata %O', metadata);
		try {
			await this.#channel?.publish(
				process.env.RABBITMQ_EXCHANGE,
				process.env.RABBITMQ_ROUTING_KEY,
				Buffer.from(message),
				{ headers: metadata }
			);
			log.info('Message sent successfully.');
		} catch (error) {
			log.error(`Error in sending message: ${error.message}`);
			throw error;
		}
	}
}

export default new RabbitMQProvider();
