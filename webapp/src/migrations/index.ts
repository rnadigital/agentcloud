import fs from 'fs';
import semver from 'semver';

let versions = [];

// rather this than write a static index file
fs.readdirSync(__dirname).forEach(file => {
	const version = file.substring(0, file.length - 3);
	if (!semver.valid(version)) {
		return;
	}
	versions.push(version);
});

export default versions;
