'use strict';

import { addTask, deleteTaskById, getTaskById, getTasksByTeam, updateTask } from 'db/task';
import toObjectId from 'misc/toobjectid';
import toSnakeCase from 'misc/tosnakecase';
import { Task } from 'struct/task';

import { removeAgentsModel } from '../db/agent';
import { getToolsByTeam } from '../db/tool';
import { chainValidations } from '../lib/utils/validationUtils';
import { dynamicResponse } from '../util';

export async function tasksData(req, res, _next) {
	const [tasks, tools] = await Promise.all([
		getTasksByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		tools,
		tasks,
	};
}

/**
* GET /[resourceSlug]/tasks
* task page html
*/
export async function tasksPage(app, req, res, next) {
	const data = await tasksData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/tasks`);
}

/**
* GET /[resourceSlug]/tasks.json
* team tasks json data
*/
export async function tasksJson(req, res, next) {
	const data = await tasksData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

export async function taskData(req, res, _next) {
	const [task, tools] = await Promise.all([
		getTaskById(req.params.resourceSlug, req.params.taskId),
		getToolsByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		tools,
		task,
	};
}

/**
* GET /[resourceSlug]/task/:taskId.json
* task json data
*/
export async function taskJson(req, res, next) {
	const data = await taskData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
* GET /[resourceSlug]/task/:taskId/edit
* task edit page html
*/
export async function taskEditPage(app, req, res, next) {
	const data = await taskData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/task/${req.params.taskId}/edit`);
}

/**
* GET /[resourceSlug]/task/add
* task add page html
*/
export async function taskAddPage(app, req, res, next) {
	const data = await taskData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/task/add`);
}

export async function addTaskApi(req, res, next) {

	const { name, description, expectedOutput, toolIds, asyncExecution }  = req.body;

	const task = await getTaskById(req.params.resourceSlug, req.params.taskId);
	if (!task) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const addedTask = await addTask({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name,
		description,
		expectedOutput,
		toolIds: toolIds.map(toObjectId),
		asyncExecution: asyncExecution === true,
	});

	return dynamicResponse(req, res, 302, { _id: addedTask.insertedId, redirect: `/${req.params.resourceSlug}/tasks` });

}

export async function editTaskApi(req, res, next) {

	const { name, description, expectedOutput, toolIds, asyncExecution }  = req.body;

	const task = await getTaskById(req.params.resourceSlug, req.params.taskId);
	if (!task) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await updateTask(req.params.resourceSlug, req.params.taskId, {
		name,
		description,
		expectedOutput,
		toolIds: toolIds.map(toObjectId),
		asyncExecution: asyncExecution === true,
	});

	return dynamicResponse(req, res, 302, { /*redirect: `/${req.params.resourceSlug}/tasks`*/ });

}

/**
* @api {delete} /forms/task/[taskId] Delete a task
* @apiName delete
* @apiGroup Task
*
* @apiParam {String} taskId task id
*/
export async function deleteTaskApi(req, res, next) {

	const { taskId } = req.body;

	if (!taskId || typeof taskId !== 'string' || taskId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await Promise.all([
		deleteTaskById(req.params.resourceSlug, taskId),
//TODO: reference handling?
	]);

	return dynamicResponse(req, res, 302, { });

}
