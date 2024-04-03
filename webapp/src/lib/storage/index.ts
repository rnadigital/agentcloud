import GoogleStorageProvider from 'storage/google';

export default class StorageProviderFactory {
	static getStorageProvider() {
		switch ((process.env.STORAGE_PROVIDER||'').toLowerCase()) {
			case 'google':
				return GoogleStorageProvider;
			case 'local':
				return null; //LocalDiskStorageProvider
			default:
				throw new Error('No valid storage provider configuration found.');
		}
	}
}
