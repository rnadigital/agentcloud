'use strict';

import * as db from 'db/index';
import toObjectId from 'misc/toobjectid';
import { UpdateResult } from 'mongodb';
import { VectorDb, VectorDbModel } from 'struct/vectordb';

export type GetVectorDb = ReturnType<typeof getVectorDbById>;

export function getVectorDbById(vectorDbId: db.IdOrStr) {
	return VectorDbModel.findOne({
		_id: toObjectId(vectorDbId)
	});
}

export type GetVectorDbsByTeam = ReturnType<typeof getVectorDbsByTeam>;

export async function getVectorDbsByTeam(teamId: db.IdOrStr) {
	return VectorDbModel.find({
		teamId: toObjectId(teamId)
	});
}

export async function addVectorDb(vectorDb: VectorDb) {
	return VectorDbModel.create(vectorDb);
}

export async function updateVectorDb(
	vectorDbId: db.IdOrStr,
	vectorDb: Partial<VectorDb>
): Promise<UpdateResult> {
	return VectorDbModel.updateOne(
		{
			_id: toObjectId(vectorDbId)
		},
		{
			...vectorDb
		}
	);
}

export function deleteVectorDbById(vectorDbId: db.IdOrStr) {
	return VectorDbModel.deleteOne({
		_id: toObjectId(vectorDbId)
	});
}
