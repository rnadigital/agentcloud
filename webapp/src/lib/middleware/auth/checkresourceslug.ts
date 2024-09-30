'use strict';

import { dynamicResponse } from '@dr';
import { unsafeGetAppById } from 'db/app';
import { getOrgById } from 'db/org';
import { unsafeGetSessionById } from 'db/session';
import { getTeamById } from 'db/team';
import debug from 'debug';

const log = debug('webapp:middleware:auth:checkresourceslug');

function getAllowedSlugs(orgs) {
	return orgs.reduce((acc, org) => {
		if (org?.teams?.length > 0) {
			acc = acc.concat(org.teams.map(t => t.id.toString()));
		}
		return acc;
	}, []);
}

export async function checkResourceSlug(req, res, next) {
	if (
		!req.params?.resourceSlug ||
		req.params.resourceSlug.length === 0 ||
		!res?.locals?.account?.orgs
	) {
		return dynamicResponse(req, res, 302, { redirect: '/welcome?noaccess=true' });
	}
	const allowedSlugs = getAllowedSlugs(res.locals.account.orgs);
	if (!allowedSlugs.includes(req.params.resourceSlug.toString())) {
		return dynamicResponse(req, res, 302, { redirect: '/welcome?noaccess=true' });
	}

	// Set org/team that we are currently acting within in res locals
	const matchingOrg = res.locals.account.orgs.find(o =>
		o.teams.find(t => t.id.toString() === req.params.resourceSlug)
	);
	if (!matchingOrg) {
		return dynamicResponse(req, res, 302, { redirect: '/welcome?noaccess=true' });
	}
	res.locals.matchingOrg = matchingOrg;

	//TODO: cache in redis
	const foundOrg = await getOrgById(matchingOrg.id);
	res.locals.matchingOrg.permissions = foundOrg.permissions;

	const matchingTeam = matchingOrg.teams.find(t => t.id.toString() === req.params.resourceSlug);
	if (!matchingTeam) {
		return dynamicResponse(req, res, 302, { redirect: '/welcome?noaccess=true' });
	}
	res.locals.matchingTeam = matchingTeam;

	//TODO: cache in redis
	const foundTeam = await getTeamById(matchingTeam.id);
	res.locals.matchingTeam.permissions = foundTeam.permissions;
	res.locals.matchingTeam.members = foundTeam.members;

	next();
}

export async function checkResourceSlugQuery(req, res, next) {
	if (!req.query?.resourceSlug) {
		return next();
	}

	const allowedSlugs = getAllowedSlugs(res.locals.account.orgs);
	if (req.query?.resourceSlug && !allowedSlugs.includes(req.query.resourceSlug.toString())) {
		return res.status(403).send({ error: 'No permission' });
	}

	// Set org/team that we are currently acting within in res locals
	const matchingOrg = res.locals.account.orgs.find(o =>
		o.teams.find(t => t.id.toString() === req.query.resourceSlug)
	);
	if (req.query?.resourceSlug && !matchingOrg) {
		return res.status(403).send({ error: 'No permission' });
	}
	res.locals.matchingOrg = matchingOrg;

	//TODO: cache in redis
	const foundOrg = await getOrgById(matchingOrg.id);
	res.locals.matchingOrg.permissions = foundOrg.permissions;

	const matchingTeam = matchingOrg.teams.find(t => t.id.toString() === req.query.resourceSlug);
	if (req.query?.resourceSlug && !matchingTeam) {
		return res.status(403).send({ error: 'No permission' });
	}
	res.locals.matchingTeam = matchingTeam;

	//TODO: cache in redis
	const foundTeam = await getTeamById(matchingTeam.id);
	res.locals.matchingTeam.permissions = foundTeam.permissions;

	next();
}

export async function setDefaultOrgAndTeam(req, res, next) {
	//TODO: project any sensitive org props away here

	const { currentOrg, currentTeam } = res?.locals?.account || {};
	if (!currentOrg) {
		log('No current organization available');
		req.session.destroy();
		return dynamicResponse(req, res, 302, {
			redirect: `/login?goto=${encodeURIComponent(req.originalUrl)}`
		});
	}
	//TODO: cache in redis
	const foundOrg = await getOrgById(currentOrg);
	if (!foundOrg) {
		log('No permission, sending to welcome');
		return dynamicResponse(req, res, 302, { redirect: '/welcome?noaccess=true' });
	}
	foundOrg['id'] = foundOrg._id;
	res.locals.matchingOrg = foundOrg;
	res.locals.matchingOrg.permissions = foundOrg.permissions;

	const matchingTeamId = foundOrg.teamIds.find(tid => tid.toString() === currentTeam.toString());
	if (!matchingTeamId) {
		// return res.status(403).send({ error: 'No permission' });
		log('No permission');
		// req.session.destroy();
		return dynamicResponse(req, res, 302, { redirect: '/welcome?noaccess=true' });
	}

	//TODO: cache in redis
	const foundTeam = await getTeamById(currentTeam);
	if (!foundTeam) {
		// return res.status(403).send({ error: 'No permission' });
		log('No permission');
		// req.session.destroy();
		return dynamicResponse(req, res, 302, { redirect: '/welcome?noaccess=true' });
	}
	foundTeam['id'] = foundTeam._id;
	res.locals.matchingTeam = foundTeam;
	res.locals.matchingTeam.permissions = foundTeam.permissions;

	next();
}
export async function setParamOrgAndTeam(req, res, next) {
	//TODO: project any sensitive org/team props away here

	const { resourceSlug } = req.params || {};

	//TODO: cache in redis
	const foundTeam = await getTeamById(resourceSlug);
	if (!foundTeam) {
		// return res.status(403).send({ error: 'No permission' });
		log('No permission');
		// req.session.destroy();
		return dynamicResponse(req, res, 302, { redirect: '/welcome?noaccess=true' });
	}
	foundTeam['id'] = foundTeam._id;
	res.locals.matchingTeam = foundTeam;
	res.locals.matchingTeam.permissions = foundTeam.permissions;

	//TODO: cache in redis
	const foundOrg = await getOrgById(foundTeam.orgId);
	if (!foundOrg) {
		// return res.status(403).send({ error: 'No permission' });
		log('No permission');
		// req.session.destroy();
		return dynamicResponse(req, res, 302, { redirect: '/welcome?noaccess=true' });
	}
	foundOrg['id'] = foundOrg._id;
	res.locals.matchingOrg = foundOrg;
	res.locals.matchingOrg.permissions = foundOrg.permissions;

	next();
}
