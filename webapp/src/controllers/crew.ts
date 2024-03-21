'use strict';

import { dynamicResponse } from '@dr';
import toObjectId from 'misc/toobjectid';
import { ProcessImpl } from 'struct/crew';

import { getAgentsById, getAgentsByTeam } from '../db/agent';
import { addCrew, deleteCrewById, getCrewById, getCrewsByTeam, updateCrew } from '../db/crew';

export async function crewsData(req, res, _next) {
	const crews = await getCrewsByTeam(req.params.resourceSlug);
	const teamAgents = await getAgentsByTeam(req.params.resourceSlug);
	return {
		csrf: req.csrfToken(),
		crews,
		hasAgents: teamAgents.length > 0,
	};
}

export async function crewData(req, res, _next) {
	const crewData = await getCrewById(req.params.resourceSlug, req.params.crewId);
	const teamAgents = await getAgentsByTeam(req.params.resourceSlug);
	return {
		csrf: req.csrfToken(),
		crewData,
		hasAgents: teamAgents.length > 0,
	};
}

/**
 * GET /[resourceSlug]/crews
 * crew page html
 */
export async function crewsPage(app, req, res, next) {
	const data = await crewsData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/crews`);
}

/**
 * GET /[resourceSlug]/crew/[crewId].json
 * crew json data
 */
export async function crewJson(req, res, next) {
	const data = await crewData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
 * GET /[resourceSlug]/crews.json
 * crew page json data
 */
export async function crewsJson(req, res, next) {
	const data = await crewsData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
 * GET /[resourceSlug]/crew/add
 * crew page json data
 */
export async function crewAddPage(app, req, res, next) {
	const data = await crewsData(req, res, next); //needed? also see agents controller
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/crew/add`);
}

/**
 * GET /[resourceSlug]/crew/[crewId]/edit
 * crew page html
 */
export async function crewEditPage(app, req, res, next) {
	const data = await crewData(req, res, next);
	res.locals.data = {
		...data,
		account: res.locals.account,
	};
	return app.render(req, res, `/${req.params.resourceSlug}/crew/${req.params.crewId}/edit`); 
}

/**
 * @api {post} /forms/crew/add Add a crew
 * @apiName add
 * @apiCrew Crew
 *
 * @apiParam {String} name Crew name
 * @apiParam {String[]} agents array of other agent ids
 */
export async function addCrewApi(req, res, next) {

	const { name, agents, crewChat, process }  = req.body;

	if (!name || typeof name !== 'string' || name.length === 0
		|| !agents || !Array.isArray(agents) || agents.length === 0 || agents.some(i => typeof i !== 'string' || i.length != 24)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const foundAgents = await getAgentsById(req.params.resourceSlug, agents);
	if (!foundAgents || foundAgents.length !== agents.length) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	if (!Object.values(ProcessImpl).includes(process)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid process implementation' });
 	}

	const addedCrew = await addCrew({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name,
		tasks: [], //TODO
		agents: agents.map(toObjectId),
		process,
	});

	return dynamicResponse(req, res, 302, { _id: addedCrew.insertedId, redirect: `/${req.params.resourceSlug}/crews` });

}

/**
 * @api {post} /forms/crew/[crewId]/edit Edit a crew
 * @apiName edit
 * @apiCrew Agent
 *
 * @apiParam {String} name Crew name
 * @apiParam {String[]} agents array of other agent ids
 */
export async function editCrewApi(req, res, next) {

	const { name, adminAgent, agents, crewChat }  = req.body;

	if (!name || typeof name !== 'string' || name.length === 0
		|| !agents || !Array.isArray(agents) || agents.some(i => typeof i !== 'string' || i.length != 24)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await updateCrew(req.params.resourceSlug, req.params.crewId, {
	    name,
		tasks: [], //TODO
		agents: agents.map(toObjectId),
		process: ProcessImpl.SEQUENTIAL, //TODO
	});

	return dynamicResponse(req, res, 302, { redirect: `/${req.params.resourceSlug}/crew/${req.params.crewId}/edit` });

}

/**
 * @api {delete} /forms/crew/[crewId] Delete a crew
 * @apiName delete
 * @apiCrew Crew
 *
 * @apiParam {String} crewId Crew id
 */
export async function deleteCrewApi(req, res, next) {

	const { crewId }  = req.body;

	if (!crewId || typeof crewId !== 'string' || crewId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await deleteCrewById(req.params.resourceSlug, crewId);

	return dynamicResponse(req, res, 302, { /*redirect: `/${req.params.resourceSlug}/crews`*/ });

}
