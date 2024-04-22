'use strict';

import * as db from 'db/index';
import debug from 'debug';
import toObjectId from 'misc/toobjectid';
import { Datasource, DatasourceConnectionSettings, DatasourceRecordCount,DatasourceStatus } from 'struct/datasource';
import { InsertResult } from 'struct/db';

const log = debug('webapp:db:datasources');

export function DatasourceCollection(): any {
	return db.db().collection('datasources');
}

export function getDatasourceById(teamId: db.IdOrStr, datasourceId: db.IdOrStr): Promise<Datasource> {
	return DatasourceCollection().findOne({
		_id: toObjectId(datasourceId),
		teamId: toObjectId(teamId),
	});
}

export function getDatasourceByIdUnsafe(datasourceId: db.IdOrStr): Promise<Datasource> {
	return DatasourceCollection().findOne({
		_id: toObjectId(datasourceId),
	});
}

export function getDatasourceByConnectionId(connectionId: string): Promise<Datasource> {
	return DatasourceCollection().findOne({
		connectionId,
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

export async function addDatasource(datasource: Datasource): Promise<InsertResult> {
	return DatasourceCollection().insertOne(datasource);
}

export async function setDatasourceConnectionSettings(teamId: db.IdOrStr, datasourceId: db.IdOrStr, connectionId: db.IdOrStr, connectionSettings: DatasourceConnectionSettings): Promise<any> {
	return DatasourceCollection().updateOne({
		_id: toObjectId(datasourceId),
		teamId: toObjectId(teamId),
	}, {
		$set: {
			connectionId,
			connectionSettings,
		},
	});
}

export async function setDatasourceLastSynced(teamId: db.IdOrStr, datasourceId: db.IdOrStr, lastSyncedDate: Date): Promise<any> {
	return DatasourceCollection().updateOne({
		_id: toObjectId(datasourceId),
		teamId: toObjectId(teamId),
	}, {
		$set: {
			lastSyncedDate,
		},
	});
}

export async function setDatasourceStatus(teamId: db.IdOrStr, datasourceId: db.IdOrStr, status: DatasourceStatus): Promise<any> {
	return DatasourceCollection().updateOne({
		_id: toObjectId(datasourceId),
		teamId: toObjectId(teamId),
	}, {
		$set: {
			status,
		},
	});
}

export async function setDatasourceTotalRecordCount(teamId: db.IdOrStr, datasourceId: db.IdOrStr, total: number): Promise<any> {
	return DatasourceCollection().updateOne({
		_id: toObjectId(datasourceId),
		teamId: toObjectId(teamId),
	}, {
		$set: {
			'recordCount.total': total,
			'recordCount.success': 0,
			'recordCount.failure': 0,
		},
	});
}

export async function setDatasourceEmbedding(teamId: db.IdOrStr, datasourceId: db.IdOrStr, modelId: db.IdOrStr, embeddingField: string): Promise<any> {
	return DatasourceCollection().updateOne({
		_id: toObjectId(datasourceId),
		teamId: toObjectId(teamId),
	}, {
		$set: {
			modelId: toObjectId(modelId),
			embeddingField,
		},
	});
}

export async function editDatasource(teamId: db.IdOrStr, datasourceId: db.IdOrStr, datasource: Datasource): Promise<InsertResult> {
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
