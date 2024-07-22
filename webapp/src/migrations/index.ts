import fs from 'node:fs';

import semver from 'semver';

let migrationVersions = [];

// rather this than write a static index file
fs.readdirSync(__dirname).forEach(file => {
	const version = file.substring(0, file.length - 3);
	if (!semver.valid(version)) {
		return;
	}
	migrationVersions.push(version);
});

const sortedVersions = migrationVersions.sort(semver.compare);
const migrationVersion = sortedVersions[sortedVersions.length - 1];

export { migrationVersions, migrationVersion };
