export default class StorageProvider {
	async init() {
		throw new Error('init method not implemented');
	}

	async addFile(filename: string, content: Buffer, contentType: string, isPublic = false): Promise<any> {
		throw new Error('addFile method not implemented');
	}

	async deleteFile(filename: string): Promise<any> {
		throw new Error('deleteFile method not implemented');
	}

	getBasePath() {
		throw new Error('getBasePath method not implemented.');
	}
}
