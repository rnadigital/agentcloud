'use strict';

import { CredentialPlatform } from './credential';

//TODO: types
export const ModelList = {
	[CredentialPlatform.OPENAI]: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-1106-preview'],
	[CredentialPlatform.AZURE]: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-1106-preview'],	
};
