export default class MessageQueueProvider {
	async init() {
		throw new Error('init method not implemented');
	}

	async sendMessage(message: string, metadata: any): Promise<void> {
		throw new Error('sendMessage method not implemented');
	}
}
