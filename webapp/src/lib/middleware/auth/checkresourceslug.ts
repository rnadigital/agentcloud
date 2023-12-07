'use strict';

export default function checkResourceSlug(req, res, next) {
	if (!req.params?.resourceSlug || req.params.resourceSlug.length === 0) {
		return res.status(403).send({ error: 'No permission' });
	}
	const allowedSlugs = res.locals.account.orgs
		.reduce((acc, org) => {
			if (org?.teams?.length > 0) {
				acc = acc.concat(org.teams.map(t => t.id.toString()));
			}
			return acc;
		}, []);
	if (!allowedSlugs.includes(req.params.resourceSlug.toString())) {
		return res.status(403).send({ error: 'No permission' });
	}
	next();
}
