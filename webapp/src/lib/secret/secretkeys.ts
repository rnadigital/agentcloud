'use strict';

// In case the name of the actual secret changes, we maintain them in one place
const SecretKeys = {
	AMAZON_ACCESS_ID: 'AMAZON_ACCESS_ID',
	AMAZON_SECRET_ACCESS_KEY: 'AMAZON_SECRET_ACCESS_KEY',
	OAUTH_GITHUB_CLIENT_ID: 'OAUTH_GITHUB_CLIENT_ID',
	OAUTH_GITHUB_CLIENT_SECRET: 'OAUTH_GITHUB_CLIENT_SECRET',
	OAUTH_GOOGLE_CLIENT_ID: 'OAUTH_GOOGLE_CLIENT_ID',
	OAUTH_GOOGLE_CLIENT_SECRET: 'OAUTH_GOOGLE_CLIENT_SECRET',
	OAUTH_HUBSPOT_CLIENT_SECRET: 'OAUTH_HUBSPOT_CLIENT_SECRET',
	OAUTH_HUBSPOT_CLIENT_ID: 'OAUTH_HUBSPOT_CLIENT_ID',
	OAUTH_SALESFORCE_CLIENT_ID: 'OAUTH_SALESFORCE_CLIENT_ID',
	OAUTH_SALESFORCE_CLIENT_SECRET: 'OAUTH_SALESFORCE_CLIENT_SECRET',
	OAUTH_XERO_CLIENT_ID: 'OAUTH_XERO_CLIENT_ID',
	OAUTH_XERO_CLIENT_SECRET: 'OAUTH_XERO_CLIENT_SECRET',
	OAUTH_SLACK_CLIENT_ID: 'OAUTH_SLACK_CLIENT_ID',
	OAUTH_SLACK_CLIENT_SECRET: 'OAUTH_SLACK_CLIENT_SECRET',
	OAUTH_AIRTABLE_CLIENT_ID: 'OAUTH_AIRTABLE_CLIENT_ID',
	OAUTH_AIRTABLE_CLIENT_SECRET: 'OAUTH_AIRTABLE_CLIENT_SECRET',
	STRIPE_ACCOUNT_SECRET: 'STRIPE_ACCOUNT_SECRET',
	STRIPE_WEBHOOK_SECRET: 'STRIPE_WEBHOOK_SECRET'
};

export default SecretKeys;
