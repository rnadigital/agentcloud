'use strict';

import * as db from 'db/index';
import { Collection, InsertOneResult } from 'mongodb';
import { Agent, CodeExecutionConfigType } from 'struct/agent';
import { Asset } from 'struct/asset';
import { InsertResult } from 'struct/db';

import toObjectId from '../lib/misc/toobjectid';

export function AgentCollection(): Collection<Agent> {
	return db.db().collection<Agent>('agents');
}

export function getAgentById(teamId: db.IdOrStr, agentId: db.IdOrStr): Promise<Agent> {
	return AgentCollection().findOne({
		_id: toObjectId(agentId),
		teamId: toObjectId(teamId)
	});
}

export function getAgentsById(teamId: db.IdOrStr, agentIds: db.IdOrStr[]): Promise<Agent[]> {
	return AgentCollection()
		.find({
			_id: {
				$in: agentIds.map(toObjectId)
			},
			teamId: toObjectId(teamId)
		})
		.toArray();
}

export function getAgentsByTeam(teamId: db.IdOrStr): Promise<Agent[]> {
	return AgentCollection()
		.aggregate([
			{
				$match: {
					teamId: toObjectId(teamId)
				}
			},
			{
				$lookup: { from: 'groups', as: 'group', localField: '_id', foreignField: 'agents' }
			},
			{
				$addFields: {
					isGroupSet: { $cond: { if: { $gt: [{ $size: '$group' }, 0] }, then: true, else: false } }
				}
			},
			{
				$project: {
					isGroupSet: 0,
					tempGroup: 0
				}
			}
		])
		.toArray() as Promise<Agent[]>;
}

export function getAgents(teamId: db.IdOrStr, agentIds: db.IdOrStr[]): Promise<Agent[]> {
	return AgentCollection()
		.find({
			teamId: toObjectId(teamId),
			_id: {
				$in: agentIds.map(toObjectId)
			}
		})
		.toArray();
}

export async function addAgent(agent: Agent): Promise<InsertOneResult<Agent>> {
	return AgentCollection().insertOne(agent);
}

export async function addAgents(agents: Agent[]): Promise<InsertResult> {
	return AgentCollection().insertMany(agents);
}

export async function updateAgent(
	teamId: db.IdOrStr,
	agentId: db.IdOrStr,
	agent: Partial<Agent>
): Promise<InsertResult> {
	return AgentCollection().updateOne(
		{
			_id: toObjectId(agentId),
			teamId: toObjectId(teamId)
		},
		{
			$set: agent
		}
	);
}

export async function updateAgentGetOldAgent(
	teamId: db.IdOrStr,
	agentId: db.IdOrStr,
	agent: Partial<Agent>
): Promise<Agent> {
	return AgentCollection().findOneAndUpdate(
		{
			_id: toObjectId(agentId),
			teamId: toObjectId(teamId)
		},
		{
			$set: agent
		},
		{
			returnDocument: 'before'
		}
	);
}

export function removeAgentsModel(teamId: db.IdOrStr, modelId: db.IdOrStr): Promise<any> {
	return AgentCollection().updateMany(
		{
			teamId: toObjectId(teamId),
			modelId: toObjectId(modelId)
		},
		{
			$unset: {
				modelId: ''
			}
		}
	);
}

export function removeAgentsTool(teamId: db.IdOrStr, toolId: db.IdOrStr): Promise<any> {
	return AgentCollection().updateMany(
		{
			teamId: toObjectId(teamId),
			toolIds: toObjectId(toolId)
		},
		{
			$pull: {
				toolIds: toObjectId(toolId)
			}
		}
	);
}

export function deleteAgentById(teamId: db.IdOrStr, agentId: db.IdOrStr): Promise<any> {
	return AgentCollection().deleteOne({
		_id: toObjectId(agentId),
		teamId: toObjectId(teamId)
	});
}

export function deleteAgentByIdReturnAgent(
	teamId: db.IdOrStr,
	agentId: db.IdOrStr
): Promise<Agent> {
	return AgentCollection().findOneAndDelete({
		_id: toObjectId(agentId),
		teamId: toObjectId(teamId)
	});
}

export async function getAgentNameMap(
	teamId: db.IdOrStr,
	agentIds: db.IdOrStr[] = []
): Promise<Agent[]> {
	const agents = await AgentCollection()
		.find({
			teamId: toObjectId(teamId),
			_id: {
				$in: agentIds.map(toObjectId)
			}
		})
		.toArray();
	return (agents || []).reduce((acc, x) => {
		acc[x.name.toLowerCase()] = x?.icon?.filename;
		return acc;
	}, {}) as Agent[];
}

export async function unsafeGetAgentNameMap(agentIds: db.IdOrStr[] = []): Promise<Agent[]> {
	const agents = await AgentCollection()
		.find({
			_id: {
				$in: agentIds.map(toObjectId)
			}
		})
		.toArray();
	return (agents || []).reduce((acc, x) => {
		acc[x.name] = x?.icon?.filename;
		return acc;
	}, {}) as Agent[];
}
