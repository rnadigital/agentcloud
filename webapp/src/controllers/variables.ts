'use strict';

import { dynamicResponse } from '@dr';
import {
	addVariable,
	deleteVariableById,
	getVariableById,
	getVariablesByTeam,
	updateVariable
} from 'db/variable';
import toObjectId from 'misc/toobjectid';
import { chainValidations } from 'utils/validationutils';

export async function variablesData(req, res, _next) {
	const variables = await getVariablesByTeam(req.params.resourceSlug);
	return {
		csrf: req.csrfToken(),
		variables
	};
}

/**
 * GET /[resourceSlug]/variables
 * Variables page HTML
 */
export async function variablesPage(app, req, res, next) {
	const data = await variablesData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/variables`);
}

/**
 * GET /[resourceSlug]/variables.json
 * Team variables JSON data
 */
export async function variablesJson(req, res, next) {
	const data = await variablesData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
 * GET /[resourceSlug]/variable/:variableId.json
 * Variable JSON data
 */
export async function variableJson(req, res, next) {
	const variable = await getVariableById(req.params.resourceSlug, req.params.variableId);
	if (!variable) {
		return res.status(404).json({ error: 'Variable not found' });
	}
	return res.json(variable);
}

/**
 * GET /[resourceSlug]/variable/:variableId/edit
 * tool json data
 */
export async function variableEditPage(app, req, res, next) {
	const variable = await getVariableById(req.params.resourceSlug, req.params.variableId);
	res.locals.data = { variable, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/variable/${variable._id}/edit`);
}

/**
 * POST /forms/variable/add
 * Add a new variable
 */
export async function addVariableApi(req, res, next) {
	const validationError = chainValidations(
		req.body,
		[
			{ field: 'name', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'defaultValue', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'type', validation: { notEmpty: true, ofType: 'string' } }
		],
		{
			name: 'Variable Name',
			defaultValue: 'Default Value',
			type: 'Type'
		}
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const newVariable = {
		orgId: toObjectId(res.locals.matchingOrg.id),
		teamId: toObjectId(req.params.resourceSlug),
		name: req.body.name,
		defaultValue: req.body.defaultValue,
		type: req.body.type,
		createdBy: toObjectId(res.locals.account._id),
		createDate: new Date()
	};

	const result = await addVariable(newVariable);
	return dynamicResponse(req, res, 201, { _id: result.insertedId });
}

/**
 * POST /forms/variable/:variableId/edit
 * Edit an existing variable
 */
export async function editVariableApi(req, res, next) {
	const validationError = chainValidations(
		req.body,
		[
			{ field: 'name', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'defaultValue', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'type', validation: { notEmpty: true, ofType: 'string' } }
		],
		{
			name: 'Variable Name',
			defaultValue: 'Default Value',
			type: 'Type'
		}
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const updatedVariable = {
		name: req.body.name,
		defaultValue: req.body.defaultValue,
		type: req.body.type
	};

	await updateVariable(req.params.resourceSlug, req.params.variableId, updatedVariable);
	return dynamicResponse(req, res, 200, {});
}

/**
 * DELETE /forms/variable/:variableId
 * Delete a variable
 */
export async function deleteVariableApi(req, res, next) {
	const { variableId } = req.params;
	await deleteVariableById(req.params.resourceSlug, variableId);
	return dynamicResponse(req, res, 204, {});
}
