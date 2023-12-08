'use strict';

import { getDatasourcesByTeam, addDatasource, getDatasourceById, deleteDatasourceById, editDatasource } from '../db/datasource';
import { dynamicResponse } from '../util';
import toObjectId from 'misc/toobjectid';
import toSnakeCase from 'misc/tosnakecase';

export async function datasourcesData(req, res, _next) {
	const datasources = await getDatasourcesByTeam(req.params.resourceSlug);
	return {
		csrf: req.csrfToken(),
		datasources,
	};
}

/**
* GET /[resourceSlug]/datasources
* datasource page html
*/
export async function datasourcesPage(app, req, res, next) {
	const data = await datasourcesData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/datasources`);
}

/**
* GET /[resourceSlug]/datasources.json
* team datasources json data
*/
export async function datasourcesJson(req, res, next) {
	const data = await datasourcesData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

export async function datasourceData(req, res, _next) {
	const datasource = await getDatasourceById(req.params.resourceSlug, req.params.datasourceId);
	return {
		csrf: req.csrfToken(),
		datasource,
	};
}

/**
* GET /[resourceSlug]/datasource/:datasourceId.json
* datasource json data
*/
export async function datasourceJson(req, res, next) {
	const data = await datasourcesData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
* GET /[resourceSlug]/datasource/:datasourceId/edit
* datasource json data
*/
export async function datasourceEditPage(app, req, res, next) {
	const data = await datasourceData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/datasource/${data.datasource._id}/edit`);
}

/**
* GET /[resourceSlug]/datasource/add
* datasource json data
*/
export async function datasourceAddPage(app, req, res, next) {
	const data = await datasourceData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/datasource/add`);
}

export async function addDatasourceApi(req, res, next) {

	const { name /* TODO */ }  = req.body;

	//TODO: form validation
	
	//TODO: addDatasource

	return dynamicResponse(req, res, 302, { redirect: `/${req.params.resourceSlug}/datasources` });

}

export async function editDatasourceApi(req, res, next) {

	const { name /* TODO */ }  = req.body;

	//TODO: form validation
	
	//TODO: editDatasource

	return dynamicResponse(req, res, 302, { /*redirect: `/${req.params.resourceSlug}/datasources`*/ });

}

/**
* @api {delete} /forms/datasource/[datasourceId] Delete a datasource
* @apiName delete
* @apiGroup Datasource
*
* @apiParam {String} datasourceID datasource id
*/
export async function deleteDatasourceApi(req, res, next) {

	const { datasourceId } = req.body;

	if (!datasourceId || typeof datasourceId !== 'string' || datasourceId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await deleteDatasourceById(req.params.resourceSlug, datasourceId);

	return dynamicResponse(req, res, 302, { /*redirect: `/${req.params.resourceSlug}/agents`*/ });

}
