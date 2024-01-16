'use strict';

import { CredentialType } from 'struct/credential';

export const ModelList = {
	[CredentialType.OPENAI]: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-1106-preview'],
	[CredentialType.AZURE]: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-1106-preview'],
	[CredentialType.LMSTUDIO]: null,
};
