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
	#functionsClient: any;
	#projectId: string;
	#location: string;
	#bucket: string;

	constructor() {
		super();
		this.#storageProvider = StorageProviderFactory.getStorageProvider('google');
	}

	async init() {
		await this.#storageProvider.init();
		const { FunctionServiceClient } = require('@google-cloud/functions').v2;
		this.#functionsClient = new FunctionServiceClient();
		this.#projectId = process.env.PROJECT_ID;
		this.#location = process.env.GCP_FUNCTION_LOCATION;
		this.#bucket = process.env.NEXT_PUBLIC_GCS_BUCKET_NAME;
		log('Google Function Provider initialized.');
	}

	async deployFunction(code: string, requirements: string, mongoId: string, runtime: string = 'python310'): Promise<string> {
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
				buildConfig: {
					runtime: 'python310', // TODO: allow user to select
					entryPoint: 'hello_http', // Note: see functions/base.ts to understand why this is hello_http
					source: {
						storageSource: {
							bucket: this.#bucket,
							object: `${functionPath}/function.zip`,
						},
					},
					environmentVariables: {
						// Add environment variables here
					},
				},
				serviceConfig: {
					availableMemory: '256M', // TODO: allow user to configure
					timeoutSeconds: 60, // TODO: allow user to configure
					// ingressSettings: 'ALLOW_ALL',
					// Additional settings can be added here
				},
				environment: 'GEN_2',
			},
			parent: `projects/${this.#projectId}/locations/${this.#location}`,	
			functionId: `function-${mongoId}`,
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
			log(JSON.stringify(e, null, 2));
			throw e;
		}

		return functionName;
	}

}

export default new GoogleFunctionProvider();

