'use strict';

import * as db from 'db/index';
import toObjectId from 'misc/toobjectid';
import { UpdateResult } from 'mongodb';
import { InsertResult } from 'struct/db';
import { Variable } from 'struct/variable';

export function VariableCollection(): any {
	return db.db().collection('variables');
}

export function getVariableById(teamId: db.IdOrStr, variableId: db.IdOrStr): Promise<Variable> {
	return VariableCollection().findOne({
		_id: toObjectId(variableId),
		teamId: toObjectId(teamId)
	});
}

export async function getVariablesByTeam(teamId: db.IdOrStr): Promise<Variable[]> {
	return VariableCollection()
		.find({
			teamId: toObjectId(teamId)
		})
		.toArray();
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

export async function getVariableByName(
	teamId: db.IdOrStr,
	name: string
): Promise<Variable | null> {
	const variable = await VariableCollection().findOne({
		teamId: toObjectId(teamId),
		name: name
	});
	return variable;
}
