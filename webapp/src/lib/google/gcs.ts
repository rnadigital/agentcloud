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

export async function uploadFile(filename: string, uploadedFile: any) { //TODO: remove any type
	log('Uploading file %s (%s)', uploadedFile.name, filename);
	return new Promise((res, rej) => {
		const file = initialiseCloudStorageClient()
			.bucket(process.env.GCS_BUCKET_NAME) //TODO: env
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
		stream.on('finish', () => {
			log('File uploaded successfully.');
			res(null);
		});
		stream.end(uploadedFile.data);
	});
}

export async function deleteFile(filename: string) {
	log('Deleting file %s', filename);
	const file = initialiseCloudStorageClient()
		.bucket(process.env.GCS_BUCKET_NAME)
		.file(filename);
	await file.delete({});
}
