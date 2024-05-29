import { CloudFunctionsServiceClient } from '@google-cloud/functions';
import { Storage } from '@google-cloud/storage';
import archiver from 'archiver';
import debug from 'debug';
import { StandardRequirements,WrapToolCode } from 'function/base';
import StorageProviderFactory from 'lib/storage';
import { Readable } from 'stream';

import FunctionProvider from './provider';

const log = debug('webapp:function:google');

class GoogleFunctionProvider extends FunctionProvider {
	#storageProvider: any;
	#functionsClient: CloudFunctionsServiceClient;
	#projectId: string;
	#location: string;
	#bucket: string;

	constructor() {
		super();
		this.#storageProvider = StorageProviderFactory.getStorageProvider('google');
	}

	async init() {
		await this.#storageProvider.init();
		this.#functionsClient = new CloudFunctionsServiceClient();
		this.#projectId = process.env.PROJECT_ID;
		this.#location = process.env.GCP_FUNCTION_LOCATION;
		this.#bucket = process.env.NEXT_PUBLIC_GCS_BUCKET_NAME;
		log('Google Function Provider initialized.');
	}

	async deployFunction(code: string, requirements: string, mongoId: string): Promise<string> {
		const functionPath = `functions/${mongoId}`;
		const codeBuffer = Buffer.from(WrapToolCode(code));
		const requirementsBuffer = Buffer.from(`${requirements}\n${StandardRequirements.join('\n')}`);

		// Create a ZIP file
		const archive = archiver('zip', { zlib: { level: 9 } });
		const zipChunks: Buffer[] = [];
		archive.on('data', chunk => zipChunks.push(chunk));

		archive.append(Readable.from(codeBuffer), { name: 'main.py' });
		archive.append(Readable.from(requirementsBuffer), { name: 'requirements.txt' });
		await archive.finalize();

		const zipBuffer = Buffer.concat(zipChunks);

		// Upload the ZIP file to GCS
		await this.#storageProvider.uploadBuffer(`${functionPath}/function.zip`, zipBuffer, 'application/zip');

		// Construct the fully qualified location
		const location = `projects/${this.#projectId}/locations/${this.#location}`;
		const functionName = `${location}/functions/function-${mongoId}`;

		// Check if the function exists
		let functionExists = false;
		try {
			await this.#functionsClient.getFunction({ name: functionName });
			functionExists = true;
		} catch (err) {
			if (err.code !== 5) { // 5 means NOT_FOUND
				log(err);
				throw err;
			}
		}

		// Deploy the function
		const request: any = {
			function: {
				name: functionName,
				entryPoint: 'hello_world',
				runtime: 'python39',
				sourceArchiveUrl: `gs://${functionPath}/function.zip`,
				httpsTrigger: {},
			},
		};

		try {
			let response;
			if (functionExists) {
				[response] = await this.#functionsClient.updateFunction(request);
				log(`Function updated successfully: ${functionName}`);
			} else {
				request.location = location;
				[response] = await this.#functionsClient.createFunction(request);
				log(`Function created successfully: ${functionName}`);
			}
		} catch (e) {
			log(e);
			throw e;
		}

		return functionName;
	}

	async callFunction(functionId: string, data: any): Promise<any> {
		const request = {
			name: functionId,
			data: JSON.stringify(data),
		};

		const [response] = await this.#functionsClient.callFunction(request);
		log(`Function ${functionId} called successfully.`);
		return response;
	}
}

export default new GoogleFunctionProvider();

