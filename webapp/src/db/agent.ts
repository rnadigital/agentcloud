'use strict';

import * as db from './index';
import { ObjectId } from 'mongodb';
import toObjectId from '../lib/misc/toobjectid';

export enum AgentType {
	USER_PROXY_AGENT = 'UserProxyAgent',
	ASSISTANT_AGENT = 'AssistantAgent',
	EXECUTOR_AGENT = 'ExecutorAgent',
}
export type LlmConfigType = 'gpt-4-32k' | 'gpt-4-32k-0314';
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
	llmConfig?: LlmConfigType;
	codeExecutionConfig?: CodeExecutionConfigType;
	isUserProxy?: boolean;
	systemMessage: string;
	humanInputMode: HumanInputModeType;
};

export function AgentCollection() {
	return db.db().collection('agents');
}

export function getAgentById(teamId: db.IdOrStr, agentId: db.IdOrStr): Promise<Agent> {
	return AgentCollection().findOne({
		_id: toObjectId(agentId),
		teamId: toObjectId(teamId),
	});
}

export function getAgentsByTeam(teamId: db.IdOrStr): Promise<Agent[]> {
	return AgentCollection().find({
		teamId: toObjectId(teamId),
	}).toArray();
}

export async function addAgent(agent: Agent): Promise<db.InsertResult> {
	return AgentCollection().insertOne(agent);
}

export async function addAgents(agents: Agent[]): Promise<db.InsertResult> {
	return AgentCollection().insertMany(agents);
}

export async function updateAgent(teamId: db.IdOrStr, agentId: db.IdOrStr, agent: Agent): Promise<db.InsertResult> {
	return AgentCollection().updateOne({
		_id: toObjectId(agentId),
		teamId: toObjectId(teamId),
	}, {
		$set: agent,
	});
}

export function deleteAgentById(teamId: db.IdOrStr, agentId: db.IdOrStr): Promise<any> {
	return AgentCollection().deleteOne({
		_id: toObjectId(agentId),
		teamId: toObjectId(teamId),
	});
}
