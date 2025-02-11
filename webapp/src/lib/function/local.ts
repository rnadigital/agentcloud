import debug from 'debug';
import FunctionProvider from './provider';

class LocalFunctionProvider extends FunctionProvider {
	async init() {
		return;
	}

	async getFunctionLogs(functionId: string, limit = 100): Promise<string> {
		return '';
	}

	async deployFunction({
		id,
		code,
		requirements,
		runtime = 'python310',
		environmentVariables = {}
	}): Promise<string> {
		return '';
	}

	async deleteFunction(functionId: string) {
		return;
	}

	async getFunctionState(functionId: string): Promise<string> {
		return '';
	}

	async waitForFunctionToBeActive(functionId: string, maxWaitTime = 120000): Promise<boolean> {
		return false;
	}

	async callFunction(functionName: string, body: object) {
		return {};
	}
}

export default new LocalFunctionProvider();
