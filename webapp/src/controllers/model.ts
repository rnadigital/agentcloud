'use strict';

import { dynamicResponse } from '@dr';
import { removeAgentsModel } from 'db/agent';
import { addModel, deleteModelById, getModelById, getModelsByTeam, updateModel } from 'db/model';
import dotenv from 'dotenv';
import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { pricingMatrix } from 'struct/billing';
import { ModelType, ModelTypeRequirements } from 'struct/model';
import { ModelEmbeddingLength, ModelList } from 'struct/model';
import { chainValidations, PARENT_OBJECT_FIELD_NAME, validateField } from 'utils/validationutils';

dotenv.config({ path: '.env' });

export async function modelsData(req, res, _next) {
	const [models] = await Promise.all([getModelsByTeam(req.params.resourceSlug)]);
	return {
		csrf: req.csrfToken(),
		models
	};
}

export async function modelData(req, res, _next) {
	const [model] = await Promise.all([getModelById(req.params.resourceSlug, req.params.modelId)]);
	return {
		csrf: req.csrfToken(),
		model
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

export type ModelsJsonData = Awaited<ReturnType<typeof modelsData>>;

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

//need to add checks for stripe plan
export async function modelAddApi(req, res, next) {
	let { name, model, config, type } = req.body;
	let { stripePlan } = res?.locals?.account?.stripe || {};

	let validationError = chainValidations(
		req.body,
		[
			{ field: 'name', validation: { notEmpty: true } },
			{ field: 'type', validation: { inSet: new Set(Object.values(ModelType)) } },
			{ field: 'model', validation: { inSet: new Set(ModelList[type as ModelType] || []) } },
			{ field: 'config.model', validation: { inSet: new Set(ModelList[type as ModelType] || []) } }
		],
		{ name: 'Name', model: 'Model', type: 'Type', config: 'Config' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	if (!stripePlan || !pricingMatrix[stripePlan].llmModels.includes(type)) {
		return dynamicResponse(req, res, 403, { error: 'This model is not avialable on this plan' });
	}

	const configValidations = Object.entries(ModelTypeRequirements[type])
		.filter((en: any) => en[1].optional !== true)
		.map(en => ({ field: en[0], validation: { notEmpty: true } }));

	if (configValidations.length > 0) {
		let validationErrorConfig = chainValidations(req.body?.config, configValidations, {});
		if (validationErrorConfig) {
			return dynamicResponse(req, res, 400, { error: validationErrorConfig });
		}
	}

	if (!stripePlan || !pricingMatrix[stripePlan].llmModels.includes(type)) {
		return dynamicResponse(req, res, 403, { error: 'This model is not avialable on this plan' });
	}

	// Insert model to db
	const addedModel = await addModel({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name,
		model,
		embeddingLength: ModelEmbeddingLength[model] || 0,
		modelType: ModelEmbeddingLength[model] ? 'embedding' : 'llm',
		type: type || ModelType.FASTEMBED,
		config: config || {} //TODO: validation
	});

	return dynamicResponse(req, res, 302, {
		_id: addedModel.insertedId,
		redirect: `/${req.params.resourceSlug}/models`
	});
}

export async function editModelApi(req, res, next) {
	let { name, model, config, type } = req.body;
	let { stripePlan } = res?.locals?.account?.stripe || {};

	let validationError = chainValidations(
		req.body,
		[
			{ field: 'name', validation: { notEmpty: true } },
			{ field: 'model', validation: { inSet: new Set(ModelList[type as ModelType] || []) } },
			{ field: 'config.model', validation: { inSet: new Set(ModelList[type as ModelType] || []) } }
		],
		{ name: 'Name', model: 'Model' }
	);
	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	if (!stripePlan || !pricingMatrix[stripePlan]?.llmModels.includes(type)) {
		return dynamicResponse(req, res, 403, { error: 'This model is not avialable on this plan' });
	}

	const configValidations = Object.entries(ModelTypeRequirements[type])
		.filter((en: any) => en[1].optional !== true)
		.map(en => ({ field: en[0], validation: { notEmpty: true } }));
	let validationErrorConfig = chainValidations(req.body?.config, configValidations, {});
	if (validationErrorConfig) {
		return dynamicResponse(req, res, 400, { error: validationErrorConfig });
	}

	const update = {
		name,
		model,
		config,
		embeddingLength: ModelEmbeddingLength[model] || 0,
		modelType: ModelEmbeddingLength[model] ? 'embedding' : 'llm',
		type: type || ModelType.FASTEMBED
	};

	// Insert model to db
	const updatedModel = await updateModel(req.params.resourceSlug, req.params.modelId, update);

	return dynamicResponse(req, res, 302, {});
}

/**
 * @api {delete} /forms/model/[modelId] Delete a model
 * @apiName delete
 * @apiGroup Model
 *
 * @apiParam {String} modelId Model id
 */
export async function deleteModelApi(req, res, next) {
	const { modelId } = req.body;

	if (!modelId || typeof modelId !== 'string' || modelId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const model = await getModelById(req.params.resourceSlug, modelId);
	if (!model) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	Promise.all([
		removeAgentsModel(req.params.resourceSlug, modelId),
		deleteModelById(req.params.resourceSlug, modelId)
	]);

	return dynamicResponse(req, res, 302, {
		/*redirect: `/${req.params.resourceSlug}/models`*/
	});
}
