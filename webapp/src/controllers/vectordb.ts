'use strict';

import { dynamicResponse } from '@dr';
import { getDatasourcesByVectorDbId } from 'db/datasource';
import {
	addVectorDb,
	deleteVectorDbById,
	getVectorDbById,
	getVectorDbsByTeam,
	updateVectorDb
} from 'db/vectordb';
import toObjectId from 'misc/toobjectid';
import { VectorDb } from 'struct/vectordb';

function cleanTextInput(text: string): string {
	if (!text) return text;
	return text
		.replace(/[\u2028\u2029\u0085]/g, '') // Remove line separators and next line
		.replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
		.trim(); // Remove leading/trailing whitespace
}

export async function vectorDbsData(req, res, _next) {
	const vectorDbs = await getVectorDbsByTeam(req.params.resourceSlug);
	return {
		csrf: req.csrfToken(),
		vectorDbs
	};
}

/**
 * GET /[resourceSlug]/vectorDbs
 * Variables page HTML
 */
export async function vectorDbsPage(app, req, res, next) {
	const data = await vectorDbsData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/vectorDbs`);
}

/**
 * GET /[resourceSlug]/vectorDbs.json
 * Team variables JSON data
 */
export async function vectorDbsJson(req, res, next) {
	const data = await vectorDbsData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
 * GET /[resourceSlug]/vectorDb/:vectorDbId.json
 * Variable JSON data
 */
export async function vectorDbJson(req, res, next) {
	const vectorDb = await getVectorDbById(req.params.vectorDbId);
	if (!vectorDb) {
		return res.status(404).json({ error: 'VectorDb not found' });
	}
	return res.json(vectorDb);
}

/**
 * GET /[resourceSlug]/vectorDb/:vectorDbId/edit
 * tool json data
 */
export async function vectorDbEditPage(app, req, res, next) {
	const vectorDb = await getVectorDbById(req.params.vectorDbId);
	res.locals.data = { vectorDb, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/vectorDb/${vectorDb._id}/edit`);
}

/**
 * POST /forms/vectorDb/add
 * Add a new variable
 */
export async function addVectorDbApi(req, res, next) {
	const newVectorDb: VectorDb = {
		orgId: toObjectId(res.locals.matchingOrg.id),
		teamId: toObjectId(req.params.resourceSlug),
		apiKey: cleanTextInput(req.body.apiKey),
		url: cleanTextInput(req.body.url),
		type: cleanTextInput(req.body.type),
		name: cleanTextInput(req.body.name)
	};

	try {
		const result = await addVectorDb(newVectorDb);
		return dynamicResponse(req, res, 201, { _id: result.id });
	} catch (error) {
		return dynamicResponse(req, res, 400, { error });
	}
}

/**
 * POST /forms/vectorDb/:vectorDbId/edit
 * Edit an existing variable
 */
export async function editVectorDbApi(req, res, next) {
	const updatedVectorDB: Partial<VectorDb> = {
		type: cleanTextInput(req.body.type),
		apiKey: cleanTextInput(req.body.apiKey),
		url: cleanTextInput(req.body.url),
		name: cleanTextInput(req.body.name)
	};

	await updateVectorDb(req.params.vectorDbId, updatedVectorDB);
	return dynamicResponse(req, res, 200, {});
}

/**
 * DELETE /forms/vectorDb/:vectorDbId
 * Delete a variable
 */
export async function deleteVectorDbApi(req, res, next) {
	const { vectorDbId } = req.params;

	const existingVectorDb = await getVectorDbById(vectorDbId);
	const datasources = await getDatasourcesByVectorDbId(vectorDbId);

	if (!existingVectorDb) {
		return dynamicResponse(req, res, 400, {
			error: 'VectorDB does not exist'
		});
	}

	if (datasources.length > 0) {
		return dynamicResponse(req, res, 400, {
			error: 'Vector DB is used in datasources. Remove references first before deleting vector DB.'
		});
	}

	await deleteVectorDbById(vectorDbId);
	return dynamicResponse(req, res, 200, {});
}
