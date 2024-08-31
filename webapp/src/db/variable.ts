'use strict';

import * as db from 'db/index';
import toObjectId from 'misc/toobjectid';
import { UpdateResult } from 'mongodb';
import { InsertResult } from 'struct/db';
import { Variable } from 'struct/variable'; // Adjust the import path as necessary

export function VariableCollection(): any {
	return db.db().collection('variables');
}

export function getVariableById(teamId: db.IdOrStr, variableId: db.IdOrStr): Promise<Variable> {
	return VariableCollection().findOne({
		_id: toObjectId(variableId),
		teamId: toObjectId(teamId)
	});
}

export async function getVariablesByTeam(
	teamId: db.IdOrStr
): Promise<(Variable & { createdBy: string })[]> {
	const variables = await VariableCollection()
		.find({
			teamId: toObjectId(teamId)
		})
		.toArray();

	const accountIds = variables.map(variable => variable.createdBy);
	const accounts = await db
		.db()
		.collection('accounts')
		.find({
			_id: { $in: accountIds.map(toObjectId) }
		})
		.toArray();

	const accountMap = new Map(accounts.map(account => [account._id.toString(), account.name]));

	return variables.map(variable => ({
		...variable,
		createdBy: accountMap.get(variable.createdBy.toString()) || 'Unknown'
	}));
}

export async function addVariable(variable: Variable): Promise<InsertResult> {
	return VariableCollection().insertOne(variable);
}

export async function updateVariable(
	teamId: db.IdOrStr,
	variableId: db.IdOrStr,
	variable: Partial<Variable>
): Promise<UpdateResult> {
	return VariableCollection().updateOne(
		{
			_id: toObjectId(variableId),
			teamId: toObjectId(teamId)
		},
		{
			$set: variable
		}
	);
}

export function deleteVariableById(teamId: db.IdOrStr, variableId: db.IdOrStr): Promise<any> {
	return VariableCollection().deleteOne({
		_id: toObjectId(variableId),
		teamId: toObjectId(teamId)
	});
}
