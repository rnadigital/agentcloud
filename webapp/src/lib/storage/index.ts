import LocalStorageProvider from 'storage/local';

let GoogleStorageProvider: any = null;

if (typeof window === 'undefined') {
	GoogleStorageProvider = require('storage/google').default;
}

export default class StorageProviderFactory {
	static getStorageProvider(providerName?: string) {
		const provider = providerName || process.env.NEXT_PUBLIC_STORAGE_PROVIDER;
		switch ((provider || 'local').toLowerCase()) {
			case 'google':
				if (!GoogleStorageProvider) {
					console.warn('Google Storage not available on client side, falling back to local');
					return LocalStorageProvider;
				}
				return GoogleStorageProvider;
			case 'local':
				return LocalStorageProvider;
			default:
				console.error('Invalid storage provider:', provider);
				process.exit(1);
		}
	}
}
