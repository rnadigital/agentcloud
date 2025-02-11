import GoogleFunctionProvider from 'function/google';
import LocalFunctionProvider from 'function/local';

export default class FunctionProviderFactory {
	static getFunctionProvider() {
		switch ((process.env.FUNCTION_PROVIDER || '').toLowerCase()) {
			case 'google':
				return GoogleFunctionProvider;
			case 'local':
				return LocalFunctionProvider;
			default:
				console.error('Invalid FUNCTION_PROVIDER env value:', process.env.FUNCTION_PROVIDER);
				process.exit(1);
		}
	}
}
