'use strict';

import * as db from './index';
import { ObjectId } from 'mongodb';
import toObjectId from 'misc/toobjectid';
import { ToolType } from 'struct/tool';
import GlobalTools from 'struct/globaltools';
import debug from 'debug';
const log = debug('webapp:db:tools');

export type FunctionProperty = {
	type: string; // should probably be string | number | whatever
	description: string;
};

export type Tool = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
    name: string;
 	type: ToolType;
 	schema?: string; //NOTE: not really used since the function description and params are based on one function
	data?: {
		builtin?: boolean;
		name: string;
		description?: string;
		parameters?: {
			//type: string;
			properties: Record<string,FunctionProperty>;
			required?: string[];
		};
		code?: string;
	},
	credentialId?: ObjectId; //links to a credential 
};

export function ToolCollection() {
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

export async function addTool(tool: Tool): Promise<db.InsertResult> {
	return ToolCollection().insertOne(tool);
}

export async function editTool(teamId: db.IdOrStr, toolId: db.IdOrStr, tool: Tool): Promise<db.InsertResult> {
	return ToolCollection().updateOne({
		_id: toObjectId(toolId),
		teamId: toObjectId(teamId),
	}, {
		$set: tool,
	});
}

export function deleteToolById(teamId: db.IdOrStr, toolId: db.IdOrStr): Promise<any> {
	return ToolCollection().deleteOne({
		_id: toObjectId(toolId),
		teamId: toObjectId(teamId),
	});
}
