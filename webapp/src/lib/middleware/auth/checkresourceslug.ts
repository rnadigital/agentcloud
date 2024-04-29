'use strict';

import { getOrgById } from 'db/org';
import { getTeamById } from 'db/team';

export async function checkResourceSlug(req, res, next) {
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

	//TODO: cache in redis
	const foundOrg = await getOrgById(matchingOrg.id);
	res.locals.matchingOrg.permissions = foundOrg.permissions;
	
	const matchingTeam = matchingOrg.teams
		.find(t => t.id.toString() === req.params.resourceSlug);
	if (!matchingTeam) {
		return res.status(403).send({ error: 'No permission' });
	}
	res.locals.matchingTeam = matchingTeam;

	//TODO: cache in redis
	const foundTeam = await getTeamById(matchingTeam.id);
	res.locals.matchingTeam.permissions = foundTeam.permissions;

	next();
}

export async function checkAccountQuery(req, res, next) {

	//resourceSlug, memberId is optional.
	const allowedSlugs = res.locals.account.orgs
		.reduce((acc, org) => {
			if (org?.teams?.length > 0) {
				acc = acc.concat(org.teams.map(t => t.id.toString()));
			}
			return acc;
		}, []);
	if (req.query?.resourceSlug &&
		!allowedSlugs.includes(req.query.resourceSlug.toString())) {
		return res.status(403).send({ error: 'No permission 1' });
	}

	// Set org/team that we are currently acting within in res locals
	const matchingOrg = res.locals.account.orgs
		.find(o => o.teams.find(t => t.id.toString() === req.query.resourceSlug));
	if (req.query?.resourceSlug
		&& !matchingOrg) {
		return res.status(403).send({ error: 'No permission 2' });
	}
	res.locals.matchingOrg = matchingOrg;

	//TODO: cache in redis
	const foundOrg = await getOrgById(matchingOrg.id);
	res.locals.matchingOrg.permissions = foundOrg.permissions;
	
	const matchingTeam = matchingOrg.teams
		.find(t => t.id.toString() === req.query.resourceSlug);
	if (req.query?.resourceSlug
		&& !matchingTeam) {
		return res.status(403).send({ error: 'No permission 3' });
	}
	res.locals.matchingTeam = matchingTeam;

	//TODO: cache in redis
	const foundTeam = await getTeamById(matchingTeam.id);
	res.locals.matchingTeam.permissions = foundTeam.permissions;

	next();

}
