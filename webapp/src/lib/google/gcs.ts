const { Storage } = require('@google-cloud/storage');
import debug from 'debug';
const log = debug('webapp:server');

let cachedClient;

function initialiseCloudStorageClient() {
	if (cachedClient) { return cachedClient; }
	let storageInstance;
	const options = { projectId: process.env.PROJECT_ID };
	if (process.env.SECRET_KEYFILE) {
		options['keyFilename'] = process.env.SECRET_KEYFILE;
	}
	return cachedClient = new Storage();
}

export async function createBucket() {
	// https://googleapis.dev/nodejs/storage/latest/global.html#CreateBucketRequest
	await initialiseCloudStorageClient()
		.createBucket(process.env.NEXT_PUBLIC_GCS_BUCKET_NAME, {
			autoclass: {
				enabled: true,
				terminalStorageClass: 'NEARLINE',
			},
			location: process.env.GCS_BUCKET_LOCATION,
		})
		.catch(e => console.warn(e.message)); //warning only
}

export async function uploadFile(filename: string, uploadedFile: any, _public?: boolean) { //TODO: remove any type
	log('Uploading file %s (%s)', uploadedFile.name, filename);
	return new Promise((res, rej) => {
		const file = initialiseCloudStorageClient()
			.bucket(process.env.NEXT_PUBLIC_GCS_BUCKET_NAME)
			.file(filename);
		const stream = file.createWriteStream({
			metadata: {
				contentType: uploadedFile.mimetype,
			},
		});
		stream.on('error', (err) => {
			log('File upload error:', err);
			rej(err);
		});
		stream.on('finish', async () => {
			log('File uploaded successfully.');
			if (_public === true) {
				await file.makePublic();
			}
			res(null);
		});
		stream.end(uploadedFile.data);
	});
}

export async function deleteFile(filename: string) {
	log('Deleting file %s', filename);
	const file = initialiseCloudStorageClient()
		.bucket(process.env.NEXT_PUBLIC_GCS_BUCKET_NAME)
		.file(filename);
	await file.delete({});
}
