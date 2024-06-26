import GoogleStorageProvider from 'storage/google';
import LocalStorageProvider from 'storage/local';

export default class StorageProviderFactory {
	static getStorageProvider(providerName?: string) {
		const provider = providerName || process.env.NEXT_PUBLIC_STORAGE_PROVIDER;
		switch ((provider || 'local').toLowerCase()) {
			case 'google':
				return GoogleStorageProvider;
			case 'local':
				return LocalStorageProvider;
			default:
				console.error('Invalid storage provider:', provider);
				process.exit(1);
		}
	}
}
