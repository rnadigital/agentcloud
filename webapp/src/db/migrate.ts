'use strict';

import * as db from 'db/index';
import { ObjectId } from 'mongodb';
import semver from 'semver';

import toObjectId from '../lib/misc/toobjectid';
import { migrationVersion, migrationVersions } from '../migrations/index';
import { createLogger } from 'utils/logger';

const log = createLogger('webapp:migration');

export function VersionCollection(): any {
	return db.db().collection('version');
}

export function setVersion(ver: string) {
	return VersionCollection().replaceOne(
		{
			_id: 'version'
		},
		{
			_id: 'version',
			version: ver
		},
		{
			upsert: true
		}
	);
}

export async function migrate() {
	let currentVersion = await VersionCollection()
		.findOne({
			_id: 'version'
		})
		.then(res => (res ? res.version : null));
	if (!currentVersion) {
		//set latest version if version doesn't exist i.e new install
		log.info(`New database, setting latest version: ${migrationVersion}`);
		await setVersion(migrationVersion);
		return;
	}
	if (semver.lt(currentVersion, migrationVersion)) {
		log.info(`Current version: ${currentVersion}`);
		const neededMigrations = migrationVersions
			.sort(semver.compare)
			.filter(v => semver.gt(v, currentVersion));
		log.info(`Migrations needed: ${currentVersion} -> ${neededMigrations.join(' -> ')}`);
		for (let ver of neededMigrations) {
			log.info(`Starting migration to version ${ver}`);
			try {
				const migrationModule = await import(`../migrations/${ver}`);
				await migrationModule.default(db.db());
				await setVersion(ver);
			} catch (e) {
				console.error(e);
				console.warn(`Migration to ${ver} encountered an error`);
				process.exit(1);
			}
			log.info(`Finished migrating to version ${ver}`);
		}
	} else {
		log.info(
			`Migration not required, you are already on the current version (${migrationVersion})`
		);
	}
}
