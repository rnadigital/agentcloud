'use strict';

import * as db from 'db/index';
import { Agent, AgentType, CodeExecutionConfigType, HumanInputModeType } from 'struct/agent';
import { InsertResult } from 'struct/db';

import toObjectId from '../lib/misc/toobjectid';

export function AgentCollection(): any {
	return db.db().collection('agents');
}

export function getAgentById(teamId: db.IdOrStr, agentId: db.IdOrStr): Promise<Agent> {
	return AgentCollection().findOne({
		_id: toObjectId(agentId),
		teamId: toObjectId(teamId),
	});
}

export function getAgentsById(teamId: db.IdOrStr, agentIds: db.IdOrStr[]): Promise<Agent[]> {
	return AgentCollection().find({
		_id: {
			$in: agentIds.map(toObjectId),
		},
		teamId: toObjectId(teamId),
	}).toArray();
}

export function getAgentsByTeam(teamId: db.IdOrStr): Promise<Agent[]> {
	return AgentCollection().aggregate([
		{
			$match: {
				teamId: toObjectId(teamId),
			}
		}, {
			$lookup: { from: 'groups', as: 'group', localField: '_id', foreignField: 'agents' }
		}, {
			$addFields: {
				isGroupSet: { $cond: { if: { $gt: [{ $size: '$group' }, 0] }, then: true, else: false } },
			}
		}, {
			$project: {
				isGroupSet: 0,
				tempGroup: 0,
			}
		}
	]).toArray();
}

export async function addAgent(agent: Agent): Promise<InsertResult> {
	return AgentCollection().insertOne(agent);
}

export async function addAgents(agents: Agent[]): Promise<InsertResult> {
	return AgentCollection().insertMany(agents);
}

export async function updateAgent(teamId: db.IdOrStr, agentId: db.IdOrStr, agent: Agent): Promise<InsertResult> {
	return AgentCollection().updateOne({
		_id: toObjectId(agentId),
		teamId: toObjectId(teamId),
	}, {
		$set: agent,
	});
}

export function removeAgentsModel(teamId: db.IdOrStr, modelId: db.IdOrStr): Promise<any> {
	return AgentCollection().updateMany({
		teamId: toObjectId(teamId),
		modelId: toObjectId(modelId)
	}, {
		$unset: {
			modelId: '',
		},
	});
}

export function removeAgentsTool(teamId: db.IdOrStr, toolId: db.IdOrStr): Promise<any> {
	return AgentCollection().updateMany({
		teamId: toObjectId(teamId),
		toolIds: toObjectId(toolId)
	}, {
		$pull: {
			toolIds: toObjectId(toolId),
		},
	});
}

export function deleteAgentById(teamId: db.IdOrStr, agentId: db.IdOrStr): Promise<any> {
	return AgentCollection().deleteOne({
		_id: toObjectId(agentId),
		teamId: toObjectId(teamId),
	});
}
