
export default class OauthSecretProviderFactory {

    static getSecretProvider(provider: string = 'local') {
        switch(provider){
            case 'hubspot':
                const clientId = process.env.OAUTH_HUBSPOT_CLIENT_ID;
                const clientSecret = process.env.OAUTH_HUBSPOT_CLIENT_SECRET;
				return {clientId, clientSecret }
        }
    }
}