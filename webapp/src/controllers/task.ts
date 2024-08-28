'use strict';

import { dynamicResponse } from '@dr';
import { getAgentById, getAgentsByTeam } from 'db/agent';
import { getAssetById } from 'db/asset';
import {
	addTask,
	deleteTaskById,
	getTaskById,
	getTaskByName,
	getTasksByTeam,
	updateTask
} from 'db/task';
import { getReadyToolsById, getToolsByTeam } from 'db/tool';
import { chainValidations } from 'lib/utils/validationutils';
import toObjectId from 'misc/toobjectid';

export async function tasksData(req, res, _next) {
	const [tasks, tools, agents] = await Promise.all([
		getTasksByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug),
		getAgentsByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		tools,
		tasks,
		agents
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
	const [task, tools, agents, tasks] = await Promise.all([
		getTaskById(req.params.resourceSlug, req.params.taskId),
		getToolsByTeam(req.params.resourceSlug),
		getAgentsByTeam(req.params.resourceSlug),
		getTasksByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		tools,
		task,
		tasks,
		agents
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
export async function taskByName(req, res, next) {
	try {
		const task = await getTaskByName(req.params.resourceSlug, req.body.taskName);
		if (!task) {
			return res.status(404).json({ error: 'Task not found' });
		}
		return res.json({ ...task });
	} catch (error) {
		return next(error);
	}
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
	let validationError = chainValidations(
		req.body,
		[
			{ field: 'name', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'description', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'requiresHumanInput', validation: { notEmpty: true, ofType: 'boolean' } },
			{ field: 'displayOnlyFinalOutput', validation: { notEmpty: true, ofType: 'boolean' } },
			{ field: 'expectedOutput', validation: { ofType: 'string' } },
			{
				field: 'toolIds',
				validation: {
					hasLength: 24,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Tools'
				}
			},
			{ field: 'asyncExecution', validation: { ofType: 'boolean' } },
			{ field: 'agentId', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'iconId', validation: { ofType: 'string' } },
			{
				field: 'context',
				validation: {
					hasLength: 24,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid conteext'
				}
			}
		],
		{
			name: 'Name',
			description: 'Description',
			requiresHumanInput: 'Requires Human Input',
			expectedOutput: 'Expected Output',
			toolIds: 'Tool IDs',
			asyncExecution: 'Async Execution',
			agentId: 'Agent ID',
			iconId: 'Icon ID'
		}
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	if (req.body.requiresHumanInput && req.body.formFields && req.body.formFields.length > 0) {
		for (const field of req.body.formFields) {
			if (!field.position || !field.type || !field.name || !field.label) {
				return dynamicResponse(req, res, 400, {
					error: 'Each human input field must have position, type, name, and label'
				});
			}
			if (['radio', 'checkbox', 'select'].includes(field.type)) {
				if (
					!field.options ||
					field.options.length === 0 ||
					field.options.some(option => option === '')
				) {
					return dynamicResponse(req, res, 400, {
						error:
							'Human input field of type radio, checkbox, or select must have non-empty options'
					});
				}
			}
		}
	}

	const {
		name,
		description,
		requiresHumanInput,
		displayOnlyFinalOutput,
		expectedOutput,
		toolIds,
		asyncExecution,
		agentId,
		iconId,
		context,
		formFields,
		isStructuredOutput
	} = req.body;

	if (toolIds) {
		if (!Array.isArray(toolIds) || toolIds.some(id => typeof id !== 'string')) {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
		// Note: will not return tools with a state of ToolState.PENDING or ToolState.ERROR
		// const foundReadyTools = await getReadyToolsById(req.params.resourceSlug, toolIds);
		// if (!foundReadyTools || foundReadyTools?.length !== toolIds.length) {
		// 	return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		// }
	}

	const foundAgent = await getAgentById(req.params.resourceSlug, agentId);
	if (!foundAgent) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const foundIcon = await getAssetById(iconId);

	const addedTask = await addTask({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name,
		description,
		expectedOutput,
		toolIds: toolIds.map(toObjectId),
		agentId: toObjectId(agentId),
		context: context.map(toObjectId),
		asyncExecution: asyncExecution === true,
		requiresHumanInput: requiresHumanInput === true,
		displayOnlyFinalOutput: displayOnlyFinalOutput === true,
		icon: foundIcon
			? {
					id: foundIcon._id,
					filename: foundIcon.filename
				}
			: null,
		formFields: formFields,
		isStructuredOutput
	});

	return dynamicResponse(req, res, 302, {
		_id: addedTask.insertedId,
		redirect: `/${req.params.resourceSlug}/tasks`
	});
}

export async function editTaskApi(req, res, next) {
	let validationError = chainValidations(
		req.body,
		[
			{ field: 'name', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'requiresHumanInput', validation: { ofType: 'boolean' } },
			{ field: 'displayOnlyFinalOutput', validation: { notEmpty: true, ofType: 'boolean' } },
			{ field: 'description', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'expectedOutput', validation: { notEmpty: true, ofType: 'string' } },
			{
				field: 'toolIds',
				validation: {
					hasLength: 24,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Tools'
				}
			},
			{ field: 'asyncExecution', validation: { ofType: 'boolean' } },
			{ field: 'agentId', validation: { notEmpty: true, ofType: 'string' } },
			{
				field: 'context',
				validation: {
					hasLength: 24,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid conteext'
				}
			}
		],
		{
			name: 'Name',
			description: 'Description',
			requiresHumanInput: 'Requires Human Input',
			expectedOutput: 'Expected Output',
			toolIds: 'Tool IDs',
			asyncExecution: 'Async Execution',
			agentId: 'Agent ID'
		}
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	if (req.body.requiresHumanInput && req.body.formFields && req.body.formFields.length > 0) {
		for (const field of req.body.formFields) {
			if (!field.position || !field.type || !field.name || !field.label) {
				return dynamicResponse(req, res, 400, {
					error: 'Each human input field must have position, type, name, and label'
				});
			}
			if (['radio', 'checkbox', 'select'].includes(field.type)) {
				if (
					!field.options ||
					field.options.length === 0 ||
					field.options.some(option => option === '')
				) {
					return dynamicResponse(req, res, 400, {
						error:
							'Human input field of type radio, checkbox, or select must have non-empty options'
					});
				}
			}
		}
	}

	const {
		name,
		requiresHumanInput,
		displayOnlyFinalOutput,
		description,
		expectedOutput,
		toolIds,
		asyncExecution,
		agentId,
		context,
		formFields,
		isStructuredOutput
	} = req.body;

	const task = await getTaskById(req.params.resourceSlug, req.params.taskId);
	if (!task) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	if (toolIds) {
		if (!Array.isArray(toolIds) || toolIds.some(id => typeof id !== 'string')) {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
		// Note: will not return tools with a state of ToolState.PENDING or ToolState.ERROR
		const foundReadyTools = await getReadyToolsById(req.params.resourceSlug, toolIds);
		if (!foundReadyTools || foundReadyTools?.length !== toolIds.length) {
			return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		}
	}

	await updateTask(req.params.resourceSlug, req.params.taskId, {
		name,
		description,
		expectedOutput,
		toolIds: toolIds ? toolIds.map(toObjectId) : [],
		context: context ? context.map(toObjectId) : [],
		asyncExecution: asyncExecution === true,
		requiresHumanInput: requiresHumanInput === true,
		displayOnlyFinalOutput: displayOnlyFinalOutput === true,
		agentId: toObjectId(agentId),
		formFields,
		isStructuredOutput
	});

	return dynamicResponse(req, res, 302, {
		/*redirect: `/${req.params.resourceSlug}/tasks`*/
	});
}

/**
 * @api {delete} /forms/task/[taskId] Delete a task
 * @apiName delete
 * @apiGroup Task
 *
 * @apiParam {String} taskId task id
 */
export async function deleteTaskApi(req, res, next) {
	let validationError = chainValidations(
		req.body,
		[{ field: 'taskId', validation: { notEmpty: true, ofType: 'string' } }],
		{ taskId: 'Task ID' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const { taskId } = req.body;

	if (!taskId || typeof taskId !== 'string' || taskId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	await Promise.all([
		deleteTaskById(req.params.resourceSlug, taskId)
		//TODO: reference handling?
	]);

	return dynamicResponse(req, res, 302, {});
}
