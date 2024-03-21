'use strict';

import { dynamicResponse } from '@dr';
import { getAgentById, getAgentsByTeam,removeAgentsModel } from 'db/agent';
import { getDatasourcesByTeam } from 'db/datasource';
import { addTask, deleteTaskById, getTaskById, getTasksByTeam, updateTask } from 'db/task';
import { getToolsByTeam } from 'db/tool';
import { chainValidations } from 'lib/utils/validationUtils';
import toObjectId from 'misc/toobjectid';
import toSnakeCase from 'misc/tosnakecase';
import { Task } from 'struct/task';

export async function tasksData(req, res, _next) {
	const [tasks, tools, agents] = await Promise.all([
		getTasksByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug),
		getAgentsByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		tools,
		tasks,
		agents,
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
	const [task, tools, agents] = await Promise.all([
		getTaskById(req.params.resourceSlug, req.params.taskId),
		getToolsByTeam(req.params.resourceSlug),
		getAgentsByTeam(req.params.resourceSlug),
	]);
	return {
		csrf: req.csrfToken(),
		tools,
		task,
		agents,
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

	const { name, description, expectedOutput, toolIds, asyncExecution, agentId }  = req.body;

	let validationError = chainValidations(req.body, [
		{ field: 'name', validation: { notEmpty: true, lengthMin: 1, customError: 'Name must not be empty.' }},
		{ field: 'description', validation: { notEmpty: true, lengthMin: 1, customError: 'Description must not be empty.' }},
		// Include other fields as necessary
	], { name: 'Name', description: 'Description', expectedOutput: 'Expected Output', toolIds: 'Tool IDs' });

	if (validationError ) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	if (toolIds && !Array.isArray(toolIds) || toolIds.some(id => typeof id !== 'string')) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const foundAgent = await getAgentById(req.params.resourceSlug, agentId);
	if (!foundAgent) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const addedTask = await addTask({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name,
		description,
		expectedOutput,
		toolIds: toolIds.map(toObjectId),
		agentId: toObjectId(agentId),
		asyncExecution: asyncExecution === true,
	});

	return dynamicResponse(req, res, 302, { _id: addedTask.insertedId, redirect: `/${req.params.resourceSlug}/tasks` });

}

export async function editTaskApi(req, res, next) {

	const { name, description, expectedOutput, toolIds, asyncExecution, agentId }  = req.body;

	const task = await getTaskById(req.params.resourceSlug, req.params.taskId);
	if (!task) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await updateTask(req.params.resourceSlug, req.params.taskId, {
		name,
		description,
		expectedOutput,
		toolIds: toolIds ? toolIds.map(toObjectId) : [],
		asyncExecution: asyncExecution === true,
		agentId: toObjectId(agentId)
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
