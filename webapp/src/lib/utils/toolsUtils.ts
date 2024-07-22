import { Operation } from 'openapi-client-axios';

export function generateOpenAPIMatchKey(openAIoperation: Operation) {
	return `${openAIoperation.method} ${openAIoperation.path}`;
}
