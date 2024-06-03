import GoogleSecretProvider from 'secret/google';
import LocalSecretProvider from 'secret/local';

export default class SecretProviderFactory {
	static getSecretProvider(providerName?: string) {
		const provider = providerName || process.env.NEXT_PUBLIC_SECRET_PROVIDER;
		switch ((provider || '').toLowerCase()) {
			case 'google':
				return GoogleSecretProvider;
			case 'local':
				return LocalSecretProvider;
			default:
				console.error('Invalid process.env.NEXT_PUBLIC_SECRET_PROVIDER env value:', process.env.NEXT_PUBLIC_SECRET_PROVIDER);
				process.exit(1);
		}
	}
}
