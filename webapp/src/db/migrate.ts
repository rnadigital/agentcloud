'use strict';

import * as db from './index';
import { ObjectId } from 'mongodb';
import toObjectId from '../lib/misc/toobjectid';
import semver from 'semver';
import debug from 'debug';
import migrationVersions from '../migrations/index';
import { migrationVersion } from '../../package.json';
const log = debug('webapp:migration');

export function VersionCollection() {
	return db.db().collection('version');
}

export async function migrate() {
	let currentVersion = await VersionCollection().findOne({
		'_id': 'version'
	}).then(res => res ? res.version : '0.0.0'); // 0.0.0 for pre-versioned, will always be less in a semver.lt
	if (semver.lt(currentVersion, migrationVersion)) {
		log(`Current version: ${currentVersion}`);
		const neededMigrations = migrationVersions
			.sort(semver.compare)
			.filter(v => semver.gt(v, currentVersion));
		log(`Migrations needed: ${currentVersion} -> ${neededMigrations.join(' -> ')}`);
		for (let ver of neededMigrations) {
			log(`Starting migration to version ${ver}`);
			try {
				const migrationModule = await import(`../migrations/${ver}`);
				await migrationModule.default(db.db());
				await VersionCollection().replaceOne({
					'_id': 'version'
				}, {
					'_id': 'version',
					'version': ver
				}, {
					upsert: true
				});
			} catch (e) {
				console.error(e);
				console.warn(`Migration to ${ver} encountered an error`);
				process.exit(1);
			}
			log(`Finished migrating to version ${ver}`);
		}
	} else {
		log(`Migration not required, you are already on the current version (${migrationVersion})`);
	}
}
