'use strict';

import { dynamicResponse } from '@dr';
import { getOrgById } from 'db/org';
import { getTeamById } from 'db/team';
import debug from 'debug';
const log = debug('webapp:middleware:auth:checkresourceslug');

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

	if (!req.query?.resourceSlug) {
		return next();
	}

	const allowedSlugs = res.locals.account.orgs
		.reduce((acc, org) => {
			if (org?.teams?.length > 0) {
				acc = acc.concat(org.teams.map(t => t.id.toString()));
			}
			return acc;
		}, []);
	if (req.query?.resourceSlug &&
		!allowedSlugs.includes(req.query.resourceSlug.toString())) {
		return res.status(403).send({ error: 'No permission' });
	}

	// Set org/team that we are currently acting within in res locals
	const matchingOrg = res.locals.account.orgs
		.find(o => o.teams.find(t => t.id.toString() === req.query.resourceSlug));
	if (req.query?.resourceSlug
		&& !matchingOrg) {
		return res.status(403).send({ error: 'No permission' });
	}
	res.locals.matchingOrg = matchingOrg;

	//TODO: cache in redis
	const foundOrg = await getOrgById(matchingOrg.id);
	res.locals.matchingOrg.permissions = foundOrg.permissions;
	
	const matchingTeam = matchingOrg.teams
		.find(t => t.id.toString() === req.query.resourceSlug);
	if (req.query?.resourceSlug
		&& !matchingTeam) {
		return res.status(403).send({ error: 'No permission' });
	}
	res.locals.matchingTeam = matchingTeam;

	//TODO: cache in redis
	const foundTeam = await getTeamById(matchingTeam.id);
	res.locals.matchingTeam.permissions = foundTeam.permissions;

	next();

}

export async function setDefaultOrgAndTeam(req, res, next) { //TODO: project any sensitive org props away here

	const { currentOrg, currentTeam } = (res?.locals?.account||{});
	if (!currentOrg) {
		// return res.status(403).send({ error: 'No current organization available' });
		log('No current organization available');
		req.session.destroy();
		return dynamicResponse(req, res, 302, { redirect: '/login' });
	}

	//TODO: cache in redis
	const foundOrg = await getOrgById(currentOrg);
	if (!foundOrg) {
		// return res.status(403).send({ error: 'No permission' });
		log('No permission');
		req.session.destroy();
		return dynamicResponse(req, res, 302, { redirect: '/login' });
	}
	foundOrg['id'] = foundOrg._id;
	res.locals.matchingOrg = foundOrg;
	res.locals.matchingOrg.permissions = foundOrg.permissions;

	const matchingTeamId = foundOrg.teamIds
		.find(tid => tid.toString() === currentTeam.toString());
	if (!matchingTeamId) {
		// return res.status(403).send({ error: 'No permission' });
		log('No permission');
		req.session.destroy();
		return dynamicResponse(req, res, 302, { redirect: '/login' });
	}

	//TODO: cache in redis
	const foundTeam = await getTeamById(currentTeam);
	if (!foundTeam) {
		// return res.status(403).send({ error: 'No permission' });
		log('No permission');
		req.session.destroy();
		return dynamicResponse(req, res, 302, { redirect: '/login' });
	}
	foundTeam['id'] = foundTeam._id;
	res.locals.matchingTeam = foundTeam;
	res.locals.matchingTeam.permissions = foundTeam.permissions;

	next();

}
