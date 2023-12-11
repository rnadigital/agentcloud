'use strict';

import { ObjectId } from 'mongodb';

export type HumanInputModeType = 'ALWAYS' | 'NEVER' | 'TERMINAL';

export type CodeExecutionConfigType = {
	lastNMessages: number;
	workDirectory: string;
};

export type Agent = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	type: AgentType;
	codeExecutionConfig?: CodeExecutionConfigType;
	systemMessage: string;
	humanInputMode: HumanInputModeType;
	credentialId: ObjectId;
	toolIds?: ObjectId[];
	datasourceIds?: ObjectId[];
	model: string;
};

export enum AgentType {
	USER_PROXY_AGENT = 'UserProxyAgent',
	ASSISTANT_AGENT = 'AssistantAgent',
	EXECUTOR_AGENT = 'ExecutorAgent',
}
