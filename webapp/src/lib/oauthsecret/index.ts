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
					'settings.billing.write',
					'settings.currencies.read',
					'settings.currencies.write',
					'settings.users.read',
					'settings.users.write',
					'settings.users.teams.read',
					'settings.users.team.write',
					'account-info.security.read',
					'accounting',
					'actions',
					'oauth',
					'conversations.read',
					'conversations.write',
					'media_bridge.read',
					'media_bridge.write',
					'files',
					'integration-sync',
					'crm.objects.feedback_submission.read',
					'cms.knowledge_base.articles.read',
					'cms.knowledge_base.articles.write',
					'cms.knowledge_base.articles.publish',
					'automation',
					'business_units.view.read',
					'conversations.visitor_identification.tokens.create',
					'marketing-email',
					'collector.graphql_query.execute',
					'collector.graphql_schema.read'
				];
				return hubspotScopes;
		}
	}
}
