import { Storage } from '@google-cloud/storage';
import debug from 'debug';

import StorageProvider from './provider';

const log = debug('webapp:storage:google');

class GoogleStorageProvider extends StorageProvider {

	#storageClient: any;

	constructor() {
		super();
		const options: any = { projectId: process.env.PROJECT_ID };
		if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
			options['keyFilename'] = process.env.GOOGLE_APPLICATION_CREDENTIALS;
		}
		this.#storageClient = new Storage(options);
	}

	async init() {
		// this.createBucket();
	}

	async createBucket(bucketName = process.env.NEXT_PUBLIC_GCS_BUCKET_NAME, options = {}) {
		try {
			const [bucket] = await this.#storageClient.createBucket(bucketName, {
				location: process.env.GCS_BUCKET_LOCATION,
				autoclass: {
					enabled: true,
					terminalStorageClass: 'NEARLINE',
				},
				...options,
			});
			log(`GCS Bucket ${bucket.name} created.`);
			return bucket;
		} catch (e) {
			if (e.code === 409) {
				return log(`Warning when creating GCS bucket: ${e.message}`);
			}
			log(`Failed to create GCS bucket: ${e.message}`);
			throw e;
		}
	}

	async addFile(filename: string, content: Buffer, contentType: string, isPublic = false): Promise<any> {
		log('Uploading file %s', filename);
		const file = this.#storageClient
			.bucket(process.env.NEXT_PUBLIC_GCS_BUCKET_NAME)
			.file(filename);
		try {
			await file.save(content, {
				metadata: {
					contentType,
				},
			});
			log('File uploaded successfully.');
			if (isPublic) {
				await file.makePublic();
			}
		} catch (err) {
			log('File upload error:', err);
			throw err;
		}
	}

	async deleteFile(filename: string): Promise<any> {
		log('Deleting file %s', filename);
		const file = this.#storageClient
			.bucket(process.env.NEXT_PUBLIC_GCS_BUCKET_NAME)
			.file(filename);
		await file.delete({});
	}

	getBasePath() {
		return `https://storage.googleapis.com/${process.env.NEXT_PUBLIC_GCS_BUCKET_NAME}`;
	}
}

export default new GoogleStorageProvider();
