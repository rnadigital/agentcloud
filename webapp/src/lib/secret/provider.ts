export default class SecretProvider {
	async init() {}

	async getSecret(key: string, bypassCache: boolean = false) {
		throw new Error('getSecret method not implemented');
	}

	// I don't think we need these
	// async setSecret() { ... }
	// async deleteSecret() { ... }
}
