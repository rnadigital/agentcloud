'use strict';

import { dynamicResponse } from '@dr';
import { removeAgentsModel } from 'db/agent';
import { getCredentialById, getCredentialsById, getCredentialsByTeam } from 'db/credential';
import { addModel, deleteModelById, getModelById, getModelsByTeam,updateModel } from 'db/model';
import dotenv from 'dotenv';
import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { CredentialType } from 'struct/credential';
import { ModelEmbeddingLength, ModelList } from 'struct/model';
import { chainValidations, PARENT_OBJECT_FIELD_NAME, validateField } from 'utils/validationUtils';

import { addCredential, deleteCredentialById } from '../db/credential';
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

export async function modelData(req, res, _next) {
	const [model, credentials] = await Promise.all([
		getModelById(req.params.resourceSlug, req.params.modelId),
		getCredentialsByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		model,
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

export async function modelJson(req, res, next) {
	const data = await modelData(req, res, next);
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

	let { name, model, credentialId }  = req.body;

	let validationError = chainValidations(req.body, [
		{ field: 'name', validation: { notEmpty: true }},
		// { field: 'credentialId', validation: { notEmpty: true, hasLength: 24 }},
		{ field: 'model', validation: { notEmpty: true }},
	], { name: 'Name', credentialId: 'Credential', model: 'Model'});
	if (validationError) {	
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	let credential;
	if (credentialId && credentialId.length > 0) {
		// Validate model for credential is valid
		validationError = await valdiateCredentialModel(req.params.resourceSlug, credentialId, model);
		if (validationError) {
			return dynamicResponse(req, res, 400, { error: validationError });
		}
		// Check for credential
		credential = await getCredentialById(req.params.resourceSlug, credentialId);
		if (!credential) {
			return dynamicResponse(req, res, 400, { error: 'Invalid credential ID' });
		}
	}

	// Insert model to db
	const type = credential?.type || CredentialType.FASTEMBED;
	if (type === CredentialType.FASTEMBED) {
		// Insert dummy cred for agent-backend
		const dummyCred = await addCredential({
			orgId: res.locals.matchingOrg.id,
			teamId: toObjectId(req.params.resourceSlug),
		    name: '-',
		    createdDate: new Date(),
		    type,
		    credentials: {
				key: null,
				endpointURL: null
		    },
		});
		credentialId = dummyCred.insertedId;
	}
	const addedModel = await addModel({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name,
		credentialId: credentialId ? toObjectId(credentialId) : null,
		model,
		embeddingLength: ModelEmbeddingLength[model] || 0,
		modelType: ModelEmbeddingLength[model] ? 'embedding' : 'llm',
		type,
	});

	return dynamicResponse(req, res, 302, { _id: addedModel.insertedId, redirect: `/${req.params.resourceSlug}/models` });

}

export async function editModelApi(req, res, next) {

	let { name, model, credentialId }  = req.body;

	let validationError = chainValidations(req.body, [
		{ field: 'name', validation: { notEmpty: true }},
		// { field: 'credentialId', validation: { notEmpty: true, hasLength: 24 }},
		{ field: 'model', validation: { notEmpty: true }},
	], { name: 'Name', credentialId: 'Credential', model: 'Model'});
	if (validationError) {	
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const update = {
		name,
		model,
		embeddingLength: ModelEmbeddingLength[model] || 0,
		modelType: ModelEmbeddingLength[model] ? 'embedding' : 'llm',
	};

	let credential;
	if (credentialId && credentialId.length > 0) {
		// Validate model for credential is valid
		validationError = await valdiateCredentialModel(req.params.resourceSlug, credentialId, model);
		if (validationError) {
			return dynamicResponse(req, res, 400, { error: validationError });
		}
		// Check for credential
		credential = await getCredentialById(req.params.resourceSlug, credentialId);
		if (!credential) {
			return dynamicResponse(req, res, 400, { error: 'Invalid credential ID' });
		}
		update['credentialId'] = credentialId ? toObjectId(credentialId) : null;
	}
	update['type'] = credential?.type || CredentialType.FASTEMBED;

	// Insert model to db
	const updatedModel = await updateModel(req.params.resourceSlug, req.params.modelId, update);

	return dynamicResponse(req, res, 302, { });

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

	const model = await getModelById(req.params.resourceSlug, modelId);
	if (!model) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	Promise.all([
		removeAgentsModel(req.params.resourceSlug, modelId),
		deleteModelById(req.params.resourceSlug, modelId),
		model?.type === CredentialType.FASTEMBED ? deleteCredentialById(req.paarams.resourceSlug, model.credentialId) : void 0, //Delete dumym cred if this is a fastembed model
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
