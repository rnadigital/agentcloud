export default class FunctionProvider {
	async init() {
		throw new Error('init method not implemented');
	}

	async deployFunction(code: string, requirements: string): Promise<string> {
		throw new Error('deployFunction method not implemented');
	}

	async callFunction(functionId: string, data: any): Promise<any> {
		throw new Error('callFunction method not implemented');
	}
}
