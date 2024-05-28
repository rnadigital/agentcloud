import GoogleStorageProvider from 'storage/google';
import LocalStorageProvider from 'storage/local';

export default class StorageProviderFactory {
	static getStorageProvider() {
		switch ((process.env.NEXT_PUBLIC_STORAGE_PROVIDER||'').toLowerCase()) {
			case 'google':
				return GoogleStorageProvider;
			case 'local':
				return LocalStorageProvider;
			default:
				console.error('Invalid process.env.NEXT_PUBLIC_STORAGE_PROVIDER env value:', process.env.NEXT_PUBLIC_STORAGE_PROVIDER);
				process.exit(1);
		}
	}
}
