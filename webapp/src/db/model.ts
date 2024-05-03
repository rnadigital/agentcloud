'use strict';

import * as db from 'db/index';
import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { CredentialType } from 'struct/credential';
import { InsertResult } from 'struct/db';

export type Model = {
	_id?: ObjectId;
	orgId: ObjectId;
	teamId: ObjectId;
	credentialId?: ObjectId; //id of credential (holds key) in credentials db 
	name: string;
	model: string;
	modelType: string; //'embedding' | 'llm'
	embeddingLength: number;
	type?: CredentialType; //redundant
	config?: Record<string,any>;
}

export function ModelCollection(): any {
	return db.db().collection('models');
}

export function getModelById(teamId: db.IdOrStr, modelId: db.IdOrStr): Promise<Model> {
	return ModelCollection().findOne({
		_id: toObjectId(modelId),
		teamId: toObjectId(teamId),
	});
}

export function getModelsByTeam(teamId: db.IdOrStr): Promise<Model> {
	return ModelCollection().find({
		teamId: toObjectId(teamId),
	}).toArray();
}

export function getModelsById(teamId: db.IdOrStr, modelIds: db.IdOrStr[]): Promise<Model[]> {
	return ModelCollection().find({
		_id: {
			$in: modelIds.map(toObjectId),
		},
		teamId: toObjectId(teamId),
	}).toArray();
}

export async function addModel(model: Model): Promise<InsertResult> {
	return ModelCollection().insertOne(model);
}

export async function updateModel(teamId: db.IdOrStr, modelId: db.IdOrStr, model: Partial<Model>): Promise<InsertResult> {
	return ModelCollection().updateOne({
		_id: toObjectId(modelId),
		teamId: toObjectId(teamId),
	}, {
		$set: model,
	});
}

export function deleteModelById(teamId: db.IdOrStr, modelId: db.IdOrStr): Promise<any> {
	return ModelCollection().deleteOne({
		_id: toObjectId(modelId),
		teamId: toObjectId(teamId),
	});
}
