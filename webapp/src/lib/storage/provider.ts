export default class StorageProvider {

	async init() {

	}

	async addFile(filename, uploadedFile, isPublic = false): Promise<any> {
		throw new Error('addFile method not implemented');
	}

	async deleteFile(filename): Promise<any> {
		throw new Error('deleteFile method not implemented');
	}

	getBasePath() {
		throw new Error('getBasePath method not implemented.');
	}

}
