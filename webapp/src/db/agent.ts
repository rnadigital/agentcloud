'use strict';

import * as db from './index';
import toObjectId from '../lib/misc/toobjectid';
import { HumanInputModeType, CodeExecutionConfigType, Agent, AgentType } from 'struct/agent';

export function AgentCollection() {
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
			$lookup: { from: 'groups', as: 'tempGroup', localField: '_id', foreignField: 'adminAgent' }
		},  {
			$addFields: {
				group: { $cond: { if: '$isGroupSet', then: '$group', else: '$tempGroup' } },
			}
		}, {
			$project: {
				isGroupSet: 0,
				tempGroup: 0,
			}
		}
	]).toArray();
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

export function removeAgentsCredential(teamId: db.IdOrStr, credentialId: db.IdOrStr): Promise<any> {
	return AgentCollection().updateMany({
		teamId: toObjectId(teamId),
		credentialId: toObjectId(credentialId)
	}, {
		$unset: {
			credentialId: '',
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
