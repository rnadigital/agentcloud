const { Storage } = require('@google-cloud/storage');
import debug from 'debug';
import StorageProvider from 'storage/provider';

const log = debug('webapp:storage:google');

class GoogleStorageProvider extends StorageProvider {

	#storageClient: any;

	constructor() {
		super();		
		const options: any = { projectId: process.env.PROJECT_ID };
		if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
			options['keyFilename'] = process.env.GOOGLE_APPLICATION_CREDENTIALS;
		}
		if (typeof window !== 'undefined') {
			log('GoogleStorageProvider options:', options);
		}
		this.#storageClient = new Storage(options);
	}

	async init() {
		this.createBucket();
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

	async addFile(filename, uploadedFile, isPublic = false): Promise<any> {
		log('Uploading file %s (%s)', uploadedFile.name, filename);
		return new Promise((resolve, reject) => {
			const file = this.#storageClient
				.bucket(process.env.NEXT_PUBLIC_GCS_BUCKET_NAME)
				.file(filename);
			const stream = file.createWriteStream({
				metadata: {
					contentType: uploadedFile.mimetype,
				},
			});
			stream.on('error', (err) => {
				log('File upload error:', err);
				reject(err);
			});
			stream.on('finish', async () => {
				log('File uploaded successfully.');
				if (isPublic === true) {
					await file.makePublic();
				}
				resolve(null);
			});
			stream.end(uploadedFile.data);
		});
	}

	async deleteFile(filename): Promise<any> {
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
