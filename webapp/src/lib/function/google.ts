import { CloudFunctionsServiceClient } from '@google-cloud/functions';
import { Storage } from '@google-cloud/storage';
import debug from 'debug';
import StorageProviderFactory from 'lib/storage';

import FunctionProvider from './provider';

const log = debug('webapp:function:google');

class GoogleFunctionProvider extends FunctionProvider {
	#storageProvider: any;
	#functionsClient: CloudFunctionsServiceClient;
	#projectId: string;
	#location: string;

	constructor() {
		super();
		this.#storageProvider = StorageProviderFactory.getStorageProvider('google');
		this.#functionsClient = new CloudFunctionsServiceClient();
		this.#projectId = process.env.PROJECT_ID;
		this.#location = process.env.GCP_FUNCTION_LOCATION;
	}

	async init() {
		await this.#storageProvider.init();
		log('Google Function Provider initialized.');
	}

	async deployFunction(code: string, requirements: string, mongoId: string): Promise<string> {
		const functionPath = `functions/${mongoId}`;
		const codeBuffer = Buffer.from(code);
		const requirementsBuffer = Buffer.from(requirements);

		// Upload the files to GCS
		await this.#storageProvider.addFile(`${functionPath}/main.py`, codeBuffer, 'text/x-python');
		await this.#storageProvider.addFile(`${functionPath}/requirements.txt`, requirementsBuffer, 'text/plain');

		// Construct the fully qualified location
		const location = `projects/${this.#projectId}/locations/${this.#location}`;
		const functionName = `${location}/functions/function-${mongoId}`;

		// Deploy the function
		const request = {
			location,
			function: {
				name: functionName,
				entryPoint: 'hello_world',
				runtime: 'python39',
				sourceArchiveUrl: `${this.#storageProvider.getBasePath()}/${functionPath}`,
				httpsTrigger: {},
			},
		};

		const [response] = await this.#functionsClient.createFunction(request);
		log(`Function deployed successfully: ${functionName}`);
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
