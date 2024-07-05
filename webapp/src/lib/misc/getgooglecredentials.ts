const { GoogleAuth } = require('google-auth-library');

export default async function getGoogleCredentials() {
	const auth = new GoogleAuth();
	const credentials = await auth.getCredentials();
	return JSON.stringify(credentials);
}
