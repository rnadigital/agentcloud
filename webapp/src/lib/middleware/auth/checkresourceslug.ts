'use strict';

export default function checkResourceSlug(req, res, next) {
	if (!req.params?.resourceSlug
		|| req.params.resourceSlug.length === 0
		|| !res?.locals?.account?.orgs) {
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

	// Set org/team that we are currently acting within in res locals
	const matchingOrg = res.locals.account.orgs
		.find(o => o.teams.find(t => t.id.toString() === req.params.resourceSlug));
	if (!matchingOrg) {
		return res.status(403).send({ error: 'No permission' });
	}
	res.locals.matchingOrg = matchingOrg;
	
	const matchingTeam = matchingOrg.teams
		.find(t => t.id.toString() === req.params.resourceSlug);
	if (!matchingTeam) {
		return res.status(403).send({ error: 'No permission' });
	}
	res.locals.matchingTeam = matchingTeam;

	next();
}
