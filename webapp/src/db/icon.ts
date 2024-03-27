import debug from 'debug';
import toObjectId from 'misc/toobjectid';
import { Collection, InsertOneResult } from 'mongodb';
import { Icon } from 'struct/icon';

import * as db from './index';

const log = debug('webapp:db:icons');

export function IconCollection(): Collection<Icon> {
	return db.db().collection<Icon>('icons');
}

export async function addIcon(icon: Icon): Promise<InsertOneResult<Icon>> {
	return IconCollection().insertOne(icon);
}

export async function getIconById(iconId: db.IdOrStr): Promise<Icon | null> {
	//TODO: teamId restriction?
	return IconCollection().findOne({
		_id: toObjectId(iconId)
	});
}

export async function updateIcon(iconId: db.IdOrStr, updateData: Partial<Icon>): Promise<boolean> {
	const result = await IconCollection().updateOne(
		{ _id: toObjectId(iconId) }, 
		{ $set: updateData }
	);
	return result.matchedCount > 0;
}

export async function deleteIconById(iconId: db.IdOrStr): Promise<boolean> {
	const result = await IconCollection().deleteOne({
		_id: toObjectId(iconId)
	});
	return result.deletedCount > 0;
}

