'use strict';

import { removeAgentsModel } from 'db/agent';
import { getCredentialById, getCredentialsById, getCredentialsByTeam } from 'db/credential';
import { addModel, deleteModelById,getModelsByTeam } from 'db/model';
import dotenv from 'dotenv';
import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { ModelEmbeddingLength, ModelList } from 'struct/model';
import { chainValidations, PARENT_OBJECT_FIELD_NAME, validateField } from 'utils/validationUtils';

import { dynamicResponse } from '../util';
dotenv.config({ path: '.env' });

export async function modelsData(req, res, _next) {
	const [models, credentials] = await Promise.all([
		getModelsByTeam(req.params.resourceSlug),
		getCredentialsByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		models,
		credentials,
	};
}

/**
* GET /[resourceSlug]/models
* models page html
*/
export async function modelsPage(app, req, res, next) {
	const data = await modelsData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/models`);
}

/**
* GET /[resourceSlug]/models.json
* models json data
*/
export async function modelsJson(req, res, next) {
	const data = await modelsData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
* GET /[resourceSlug]/model/add
* models add page html
*/
export async function modelAddPage(app, req, res, next) {
	const data = await modelsData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/model/add`);
}

export async function modelAddApi(req, res, next) {

	const { name, model, credentialId }  = req.body;

	let validationError = chainValidations(req.body, [
		{ field: 'name', validation: { notEmpty: true }},
		// { field: 'credentialId', validation: { notEmpty: true, hasLength: 24 }},
		{ field: 'model', validation: { notEmpty: true }},
	], { name: 'Name', credentialId: 'Credential', model: 'Model'});
	if (validationError) {	
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	if (credentialId && credentialId.length > 0) {
		// Validate model for credential is valid
		validationError = await valdiateCredentialModel(req.params.resourceSlug, credentialId, model);
		if (validationError) {
			return dynamicResponse(req, res, 400, { error: validationError });
		}
		// Check for foundCredentials
		const foundCredential = await getCredentialById(req.params.resourceSlug, credentialId);
		if (!foundCredential) {
			return dynamicResponse(req, res, 400, { error: 'Invalid credential ID' });
		}
	}

	// Insert model to db
	const addedModel = await addModel({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name,
		credentialId: credentialId ? toObjectId(credentialId) : null,
		model,
		embeddingLength: ModelEmbeddingLength[model] || 0,
		modelType: ModelEmbeddingLength[model] ? 'embedding' : 'llm',
	});

	return dynamicResponse(req, res, 302, { _id: addedModel.insertedId, redirect: `/${req.params.resourceSlug}/models` });

}

/**
 * @api {delete} /forms/model/[modelId] Delete a model
 * @apiName delete
 * @apiGroup Model
 *
 * @apiParam {String} modelId Model id
 */
export async function deleteModelApi(req, res, next) {

	const { modelId }  = req.body;

	if (!modelId || typeof modelId !== 'string' || modelId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	Promise.all([
		removeAgentsModel(req.params.resourceSlug, modelId),
		deleteModelById(req.params.resourceSlug, modelId)
	]);

	return dynamicResponse(req, res, 302, { /*redirect: `/${req.params.resourceSlug}/credentials`*/ });

}

async function valdiateCredentialModel(teamId, credentialId, model) {
	const credential = await getCredentialById(teamId, credentialId);
	if (credential) {
		const allowedModels = ModelList[credential.type];
		return validateField(model, PARENT_OBJECT_FIELD_NAME, { inSet: allowedModels ? new Set(allowedModels) : undefined /* allows invalid types */, customError: `Model ${model} is not valid for provided credential` }, {});
	} else {
		return 'Invalid credential';
	}
}
