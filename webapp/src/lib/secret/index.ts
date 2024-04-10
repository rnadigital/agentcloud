import GoogleSecretProvider from 'secret/google';
import LocalSecretProvider from 'secret/local';

export default class SecretProviderFactory {
	static getSecretProvider() {
		switch ((process.env.NEXT_PUBLIC_SECRET_PROVIDER||'').toLowerCase()) {
			case 'google':
				return GoogleSecretProvider;
			case 'local':
			default:
				return LocalSecretProvider;
		}
	}
}
