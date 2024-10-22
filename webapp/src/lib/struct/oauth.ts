'use strict';

export enum OAUTH_PROVIDER {
	GOOGLE = 'google',
	GITHUB = 'github'
}

export type OAuthStrategy = {
	strategy: any;
	callback: Function;
	secretKeys: {
		clientId: string;
		secret: string;
	};
	path: string;
	extra?: any; // Stuff like scope (this object is a different shape depending on provider hence any)
};

export enum AIRBYTE_OAUTH_PROVIDERS { //OAuth to initiate airbyte datasource connection is handled seperately from OAuth to register/log in to agent cloud
	HUBSPOT = 'hubspot'
}
