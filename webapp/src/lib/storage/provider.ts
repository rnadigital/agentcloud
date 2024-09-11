export default class StorageProvider {
	async init() {
		throw new Error('init method not implemented');
	}

	async uploadLocalFile(
		filename: string,
		uploadedFile: any,
		contentType: string,
		isPublic = false
	): Promise<any> {
		throw new Error('uploadLocalFile method not implemented');
	}

	async uploadBuffer(
		filename: string,
		content: Buffer,
		contentType: string,
		isPublic = false
	): Promise<any> {
		throw new Error('uploadBuffer method not implemented');
	}

	async cloneFile(sourceFilename: string, destinationFilename: string): Promise<any> {
		throw new Error('cloneFile method not implemented');
	}

	async deleteFile(filename: string, isPublic = false): Promise<any> {
		throw new Error('deleteFile method not implemented');
	}

	getBasePath() {
		throw new Error('getBasePath method not implemented.');
	}
}
