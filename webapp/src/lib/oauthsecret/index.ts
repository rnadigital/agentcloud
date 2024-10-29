export default class OauthSecretProviderFactory {
	static getSecretProvider(provider: string = 'local') {
		switch (provider) {
			case 'hubspot':
				let clientId = process.env.OAUTH_HUBSPOT_CLIENT_ID;
				let clientSecret = process.env.OAUTH_HUBSPOT_CLIENT_SECRET;
				return { clientId, clientSecret };
			case 'salesforce':
				clientId = process.env.OAUTH_SALESFORCE_CLIENT_ID;
				clientSecret = process.env.OAUTH_SALESFORCE_CLIENT_SECRET;
				return { clientId, clientSecret };
			case 'xero':
				clientId = process.env.OAUTH_XERO_CLIENT_ID;
				clientSecret = process.env.OAUTH_XERO_CLIENT_SECRET;
				return { clientId, clientSecret };
		}
	}

	static getProviderScopes(provider: string = 'local') {
		switch (provider) {
			case 'hubspot-free':
				const hubspotScopesBase = new Set([
					'crm.lists.read',
					'crm.objects.contacts.read',
					'crm.objects.custom.read',
					'crm.objects.deals.read',
					'crm.objects.line_items.read',
					'crm.objects.marketing_events.read',
					'crm.objects.owners.read',
					'crm.objects.quotes.read',
					'crm.schemas.companies.read',
					'crm.schemas.contacts.read',
					'crm.schemas.deals.read',
					'crm.schemas.line_items.read',
					'crm.schemas.quotes.read',
					'settings.currencies.read',
					'settings.users.read',
					'settings.users.teams.read',
					'business-intelligence',
					'conversations.read',
					'crm.export',
					'forms',
					'forms-uploaded-files',
					'oauth',
					'integration-sync',
					'media_bridge.read',
					'sales-email-read',
					'tickets',
					'timeline'
				]);

				return [...hubspotScopesBase];
			case 'hubspot-professional':
				const hubspotScopesProfessional = [
					'cms.knowledge_base.articles.read',
					'cms.knowledge_base.settings.read',
					'crm.objects.feedback_submissions.read',
					'crm.objects.goals.read',
					'collector.graphql_query.execute',
					'collector.graphql_schema.read',
					'content',
					'ctas.read',
					'e-commerce'
				];

			case 'hubspot-enterprise':
				const hubspotScopesEnterprise = [
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
				return hubspotScopesEnterprise;
		}
	}

	static getProviderPostData(token: string, provider: string) {
		let data;
		switch (provider) {
			case 'hubspot':
				let { clientId, clientSecret } = OauthSecretProviderFactory.getSecretProvider('hubspot');
				data = {
					credentials: {
						credentials_title: 'OAuth Credentials',
						client_id: clientId,
						clientSecret: clientSecret,
						refresh_token: token
					}
				};
				return data;
			case 'salesforce':
				clientId = OauthSecretProviderFactory.getSecretProvider('salesforce').clientId;
				clientSecret = OauthSecretProviderFactory.getSecretProvider('salesforce').clientSecret;
				data = {
					sourceType: 'salesforce',
					auth_type: 'Client',
					client_id: clientId,
					client_secret: clientSecret,
					refresh_token: token
				};
			case 'xero':
				clientId = OauthSecretProviderFactory.getSecretProvider('xero').clientId;
				clientSecret = OauthSecretProviderFactory.getSecretProvider('xero').clientSecret;
				data = {
					
				}

		}
	}
}
