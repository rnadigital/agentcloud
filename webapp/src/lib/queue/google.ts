import { PubSub } from '@google-cloud/pubsub';
import MessageQueueProvider from 'queue/provider';
import { createLogger } from 'utils/logger';

const log = createLogger('webapp:queue:google');

class GooglePubSubProvider extends MessageQueueProvider {
	#pubsubClient: PubSub;

	constructor() {
		super();
	}

	async init() {
		const options: any = { projectId: process.env.PROJECT_ID };
		// if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		// 	options['keyFilename'] = process.env.GOOGLE_APPLICATION_CREDENTIALS;
		// }
		this.#pubsubClient = new PubSub(options);
		log.info('Google Pub/Sub client initialized.');
	}

	async sendMessage(message: string, metadata: any) {
		log.info('message %O', message);
		log.info('metadata %O', metadata);
		const dataBuffer = Buffer.from(message);
		try {
			const messageId = await this.#pubsubClient
				.topic(process.env.QUEUE_NAME)
				.publish(dataBuffer, metadata);
			log.info(`Message ${messageId} sent successfully.`);
		} catch (error) {
			log.error(`Error in sending message: ${error.message}`);
			throw error;
		}
	}
}

export default new GooglePubSubProvider();
