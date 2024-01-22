'use strict';

import debug from 'debug';
import toObjectId from 'misc/toobjectid';
import { Datasource } from 'struct/datasource';

import * as db from './index';
const log = debug('webapp:db:datasources');

export function DatasourceCollection() {
	return db.db().collection('datasources');
}

export function getDatasourceById(teamId: db.IdOrStr, datasourceId: db.IdOrStr): Promise<Datasource> {
	return DatasourceCollection().findOne({
		_id: toObjectId(datasourceId),
		teamId: toObjectId(teamId),
	});
}

export function getDatasourcesById(teamId: db.IdOrStr, datasourceIds: db.IdOrStr[]): Promise<Datasource[]> {
	return DatasourceCollection().find({
		_id: {
			$in: datasourceIds.map(toObjectId),
		},
		teamId: toObjectId(teamId),
	}).toArray();
}

export function getDatasourcesByTeam(teamId: db.IdOrStr): Promise<Datasource[]> {
	return DatasourceCollection().find({
		teamId: toObjectId(teamId),
	}).toArray();
}

export async function addDatasource(datasource: Datasource): Promise<db.InsertResult> {
	return DatasourceCollection().insertOne(datasource);
}

export async function setDatasourceConnectionId(teamId: db.IdOrStr, datasourceId: db.IdOrStr, connectionId: db.IdOrStr): Promise<any> {
	return DatasourceCollection().updateOne({
		_id: toObjectId(datasourceId),
		teamId: toObjectId(teamId),
	}, {
		$set: {
			connectionId: connectionId,
		},
	});
}

export async function editDatasource(teamId: db.IdOrStr, datasourceId: db.IdOrStr, datasource: Datasource): Promise<db.InsertResult> {
	return DatasourceCollection().updateOne({
		_id: toObjectId(datasourceId),
		teamId: toObjectId(teamId),
	}, {
		$set: datasource,
	});
}

export function deleteDatasourceById(teamId: db.IdOrStr, datasourceId: db.IdOrStr): Promise<any> {
	return DatasourceCollection().deleteOne({
		_id: toObjectId(datasourceId),
		teamId: toObjectId(teamId),
	});
}
