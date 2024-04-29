'use strict';

import * as db from 'db/index';
import debug from 'debug';
import toObjectId from 'misc/toobjectid';
import { InsertResult } from 'struct/db';
import GlobalTools from 'struct/globaltools';
import { Tool } from 'struct/tool';

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
	return ToolCollection().bulkWrite(GlobalTools.map(gt => ({
		replaceOne: {
			filter: { 'data.builtin': true, name: gt.name },
			replacement: gt,
			upsert: true,
		}
	})));
}

export function getToolById(teamId: db.IdOrStr, toolId: db.IdOrStr): Promise<Tool> {
	return ToolCollection().findOne({
		_id: toObjectId(toolId),
		$or: [
			{ teamId: toObjectId(teamId) },
			{ 'data.builtin': true },
		],
	});
}

export function getToolsById(teamId: db.IdOrStr, toolIds: db.IdOrStr[]): Promise<Tool[]> {
	return ToolCollection().find({
		_id: {
			$in: toolIds.map(toObjectId),
		},
		$or: [
			{ teamId: toObjectId(teamId) },
			{ 'data.builtin': true },
		],
	}).toArray();
}

export function getToolsByTeam(teamId: db.IdOrStr): Promise<Tool[]> {
	return ToolCollection().find({
		$or: [
			{ teamId: toObjectId(teamId) },
			{ 'data.builtin': true },
		],
	}).toArray();
}

export async function addTool(tool: Tool): Promise<InsertResult> {
	return ToolCollection().insertOne(tool);
}

export async function editTool(teamId: db.IdOrStr, toolId: db.IdOrStr, tool: Tool): Promise<InsertResult> {
	return ToolCollection().updateOne({
		_id: toObjectId(toolId),
		teamId: toObjectId(teamId),
	}, {
		$set: tool,
	});
}

export async function editToolsForDatasource(teamId: db.IdOrStr, datasourceId: db.IdOrStr, update: any): Promise<InsertResult> {
	return ToolCollection().updateOne({
		teamId: toObjectId(teamId),
		datasourceId: toObjectId(datasourceId),
	}, {
		$set: update, //Note: any type and not a Partial because we use a mongo dot notation update
	});
}

export function deleteToolById(teamId: db.IdOrStr, toolId: db.IdOrStr): Promise<any> {
	return ToolCollection().deleteOne({
		_id: toObjectId(toolId),
		teamId: toObjectId(teamId),
	});
}
