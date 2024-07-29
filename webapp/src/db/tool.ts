'use strict';

import * as db from 'db/index';
import debug from 'debug';
import toObjectId from 'misc/toobjectid';
import { UpdateResult } from 'mongodb'; //TODO: put these in all other db update* return types
import { InsertResult } from 'struct/db';
import GlobalTools from 'struct/globaltools';
import { Tool, ToolState, ToolType } from 'struct/tool';

const log = debug('webapp:db:tools');

export function ToolCollection(): any {
	return db.db().collection('tools');
}

export async function initGlobalTools() {
	if (GlobalTools.length === 0) {
		log('No global tools found.');
		return;
	}
	await ToolCollection().deleteMany({ 'data.builtin': true }); //monkey patch until we have a better deployment flow for alpha
	return ToolCollection().bulkWrite(
		GlobalTools.map(gt => ({
			replaceOne: {
				filter: { 'data.builtin': true, name: gt.name },
				replacement: gt,
				upsert: true
			}
		}))
	);
}

export function getToolById(teamId: db.IdOrStr, toolId: db.IdOrStr): Promise<Tool> {
	return ToolCollection().findOne({
		_id: toObjectId(toolId),
		$or: [{ teamId: toObjectId(teamId) }, { 'data.builtin': true }]
	});
}

export function getFunctionToolCountByTeam(teamId: db.IdOrStr): Promise<number> {
	return ToolCollection().estimatedDocumentCount({
		teamId: toObjectId(teamId),
		type: ToolType.FUNCTION_TOOL
	});
}

export function getToolsById(teamId: db.IdOrStr, toolIds: db.IdOrStr[]): Promise<Tool[]> {
	return ToolCollection()
		.find({
			_id: {
				$in: toolIds.map(toObjectId)
			},
			$or: [{ teamId: toObjectId(teamId) }, { 'data.builtin': true }]
		})
		.toArray();
}

export function getReadyToolsById(teamId: db.IdOrStr, toolIds: db.IdOrStr[]): Promise<Tool[]> {
	return ToolCollection()
		.find({
			_id: {
				$in: toolIds.map(toObjectId)
			},
			$or: [{ teamId: toObjectId(teamId) }, { 'data.builtin': true }],
			state: {
				$in: [null, ToolState.READY]
			}
		})
		.toArray();
}

export function getToolsByTeam(teamId: db.IdOrStr): Promise<Tool[]> {
	return ToolCollection()
		.find({
			$or: [{ teamId: toObjectId(teamId) }, { 'data.builtin': true }]
		})
		.toArray();
}

export async function addTool(tool: Tool): Promise<InsertResult> {
	return ToolCollection().insertOne(tool);
}

export async function editTool(
	teamId: db.IdOrStr,
	toolId: db.IdOrStr,
	update: Partial<Tool>
): Promise<UpdateResult> {
	return ToolCollection().updateOne(
		{
			_id: toObjectId(toolId),
			teamId: toObjectId(teamId)
		},
		{
			$set: update
		}
	);
}

export async function editToolUnsafe(
	filter: Partial<Tool>,
	update: Partial<Tool>
): Promise<UpdateResult> {
	return ToolCollection().updateOne(filter, {
		$set: update
	});
}

export async function getToolForDatasource(
	teamId: db.IdOrStr,
	datasourceId: db.IdOrStr
): Promise<Tool> {
	return ToolCollection().findOne({
		teamId: toObjectId(teamId),
		datasourceId: toObjectId(datasourceId)
	});
}

export async function getToolsForDatasource(
	teamId: db.IdOrStr,
	datasourceId: db.IdOrStr
): Promise<Tool[]> {
	return ToolCollection()
		.find({
			teamId: toObjectId(teamId),
			datasourceId: toObjectId(datasourceId)
		})
		.toArray();
}

export async function editToolsForDatasource(
	teamId: db.IdOrStr,
	datasourceId: db.IdOrStr,
	update: any
): Promise<InsertResult> {
	return ToolCollection().updateOne(
		{
			teamId: toObjectId(teamId),
			datasourceId: toObjectId(datasourceId)
		},
		{
			$set: update //Note: any type and not a Partial because we use a mongo dot notation update
		}
	);
}

export function deleteToolsForDatasource(
	teamId: db.IdOrStr,
	datasourceId: db.IdOrStr
): Promise<any> {
	return ToolCollection().deleteMany({
		teamId: toObjectId(teamId),
		datasourceId: toObjectId(datasourceId)
	});
}

export function deleteToolById(teamId: db.IdOrStr, toolId: db.IdOrStr): Promise<any> {
	return ToolCollection().deleteOne({
		_id: toObjectId(toolId),
		teamId: toObjectId(teamId)
	});
}
