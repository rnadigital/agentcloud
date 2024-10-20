export default class OauthSecretProviderFactory {
	static getSecretProvider(provider: string = 'local') {
		switch (provider) {
			case 'hubspot':
				const clientId = process.env.OAUTH_HUBSPOT_CLIENT_ID;
				const clientSecret = process.env.OAUTH_HUBSPOT_CLIENT_SECRET;
				return { clientId, clientSecret };
		}
	}

	static getProviderScopes(provider: string = 'local') {
		switch (provider) {
			case 'hubspot':
				const hubspotScopes = [
					'crm.lists.read',
					'crm.lists.write',
					'crm.objects.companies.read',
					'crm.objects.companies.write',
					'crm.objects.contacts.read',
					'crm.objects.contacts.write',
					'crm.objects.deals.read',
					'crm.objects.deals.write',
					'crm.objects.line_items.read',
					'crm.objects.line_items.write',
					'crm.objects.marketing_events.read',
					'crm.objects.marketing_events.write',
					'crm.objects.owners.read',
					'crm.objects.quotes.read',
					'crm.objects.quotes.write',
					'crm.schemas.companies.read',
					'crm.schemas.contacts.read',
					'crm.schemas.deals.read',
					'crm.schemas.line_items.read',
					'crm.schemas.quotes.read',
					'crm.export',
					'crm.import',
					'forms',
					'forms-uploaded-files',
					'tickets',
					'timeline',
					'settings.currencies.read',
					'settings.users.read',
					'settings.users.teams.read',
					'account-info.security.read',
					'accounting',
					'actions',
					'oauth',
					'conversations.read',
					'conversations.write',
					'media_bridge.read',
					'media_bridge.write',
					'files',
					'integration-sync'
				];
				return hubspotScopes;
		}
	}
}
