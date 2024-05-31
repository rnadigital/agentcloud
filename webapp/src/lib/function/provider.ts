import { IdOrStr } from 'db/index';

export default class FunctionProvider {
	async init() {
		throw new Error('init method not implemented');
	}

	async deployFunction(code: string, requirements: string, functionId: IdOrStr): Promise<string> {
		throw new Error('deployFunction method not implemented');
	}

	async deleteFunction(functionId: string, data: any): Promise<any> {
		throw new Error('deleteFunction method not implemented');
	}
}
