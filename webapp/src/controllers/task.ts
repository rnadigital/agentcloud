'use strict';

import { addTask, deleteTaskById, getTaskById, getTasksByTeam,updateTask } from 'db/task';
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

