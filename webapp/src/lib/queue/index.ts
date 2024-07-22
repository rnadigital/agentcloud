import GooglePubSubProvider from 'queue/google';
import RabbitMQProvider from 'queue/rabbitmq';

export default class MessageQueueProviderFactory {
	static getMessageQueueProvider() {
		switch ((process.env.MESSAGE_QUEUE_PROVIDER || '').toLowerCase()) {
			case 'rabbitmq':
				return RabbitMQProvider;
			case 'google':
				return GooglePubSubProvider;
			default:
				console.error(
					'Invalid MESSAGE_QUEUE_PROVIDER env value:',
					process.env.MESSAGE_QUEUE_PROVIDER
				);
				process.exit(1);
		}
	}
}
