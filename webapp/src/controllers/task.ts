'use strict';

import { dynamicResponse } from '@dr';
import { getAgentById, getAgentsByTeam } from 'db/agent';
import { getAppsByTeam } from 'db/app';
import { attachAssetToObject, getAssetById } from 'db/asset';
import { getCrewsByTeam } from 'db/crew';
import {
	addTask,
	deleteTaskById,
	getTaskById,
	getTaskByName,
	getTasksByTeam,
	updateTask
} from 'db/task';
import { getReadyToolsById, getToolsByTeam } from 'db/tool';
import { getVariableById, getVariablesByTeam, updateVariable } from 'db/variable';
import { chainValidations } from 'lib/utils/validationutils';
import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { CollectionName } from 'struct/db';

import { checkCanAccessApp, unsafeGetSessionById } from '../db/session';

export type TasksDataReturnType = Awaited<ReturnType<typeof tasksData>>;

export async function tasksData(req, res, _next) {
	const [tasks, tools, agents, variables] = await Promise.all([
		getTasksByTeam(req.params.resourceSlug),
		getToolsByTeam(req.params.resourceSlug),
		getAgentsByTeam(req.params.resourceSlug),
		getVariablesByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		tools,
		tasks,
		agents,
		variables
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
	const [task, tools, agents, tasks, variables] = await Promise.all([
		getTaskById(req.params.resourceSlug, req.params.taskId),
		getToolsByTeam(req.params.resourceSlug),
		getAgentsByTeam(req.params.resourceSlug),
		getTasksByTeam(req.params.resourceSlug),
		getVariablesByTeam(req.params.resourceSlug)
	]);
	return {
		csrf: req.csrfToken(),
		tools,
		task,
		tasks,
		agents,
		variables
	};
}

/**
 * GET /[resourceSlug]/task/:taskId.json
 * task json data
 */
export async function getTaskByIdJson(req, res, next) {
	const data = await taskData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

export async function getTaskJson(req, res, next) {
	const { name } = req?.query || {};
	try {
		const task = await getTaskByName(req.params.resourceSlug, name);
		if (!task) {
			return res.status(404).json({ error: 'Task not found' });
		}
		return res.json({ ...task });
	} catch (error) {
		return next(error);
	}
}

export async function publicGetTaskJson(req, res, next) {
	const { name, sessionId } = req?.query || {};
	try {
		const session = await unsafeGetSessionById(sessionId);
		const canAccess = await checkCanAccessApp(
			session?.appId?.toString(),
			false,
			res.locals.account
		);
		if (!canAccess) {
			return next();
		}
		const task = await getTaskByName(session?.teamId, name);
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
			{ field: 'requiresHumanInput', validation: { ofType: 'boolean' } },
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
			{
				field: 'variableIds',
				validation: {
					hasLength: 24,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Variables'
				}
			},
			{ field: 'asyncExecution', validation: { ofType: 'boolean' } },
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
		expectedOutput,
		toolIds,
		asyncExecution,
		agentId,
		iconId,
		context,
		storeTaskOutput,
		taskOutputFileName,
		formFields,
		isStructuredOutput,
		displayOnlyFinalOutput,
		variableIds,
		taskOutputVariableName
	} = req.body;

	const formattedTaskOutputFileName = taskOutputFileName && taskOutputFileName.replace(/\s+/g, '_');

	if (toolIds) {
		if (!Array.isArray(toolIds) || toolIds.some(id => typeof id !== 'string')) {
			return dynamicResponse(req, res, 400, { error: 'Invalid tools list input' });
		}
		// Note: will not return tools with a state of ToolState.PENDING or ToolState.ERROR
		// const foundReadyTools = await getReadyToolsById(req.params.resourceSlug, toolIds);
		// if (!foundReadyTools || foundReadyTools?.length !== toolIds.length) {
		// 	return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
		// }
	}

	let foundAgent;
	if (agentId) {
		foundAgent = await getAgentById(req.params.resourceSlug, agentId);
		if (!foundAgent) {
			return dynamicResponse(req, res, 400, { error: 'Invalid agent, agent not found' });
		}
	}

	const newTaskId = new ObjectId();
	const collectionType = CollectionName.Tasks;
	const attachedIconToTask = await attachAssetToObject(iconId, newTaskId, collectionType);

	const formFieldsWithObjectIdVariables = formFields.map(field => ({
		...field,
		variable: toObjectId(field.variable)
	}));

	const existingVariablePromises = variableIds.map(async (id: string) => {
		const variable = await getVariableById(req.params.resourceSlug, id);
		if (!variable) {
			throw new Error(`Variable with ID ${id} not found`);
		}
	});

	try {
		await Promise.all(existingVariablePromises);
	} catch (error) {
		return dynamicResponse(req, res, 400, { error: error.message });
	}

	const addedTask = await addTask({
		orgId: res.locals.matchingOrg.id,
		teamId: toObjectId(req.params.resourceSlug),
		name,
		description,
		expectedOutput,
		toolIds: toolIds.map(toObjectId),
		agentId: agentId ? toObjectId(agentId) : null,
		context: context.map(toObjectId),
		asyncExecution: asyncExecution === true,
		requiresHumanInput: requiresHumanInput === true,
		displayOnlyFinalOutput: displayOnlyFinalOutput === true,
		storeTaskOutput: storeTaskOutput === true,
		taskOutputFileName: formattedTaskOutputFileName,
		icon: attachedIconToTask
			? {
					id: attachedIconToTask._id,
					filename: attachedIconToTask.filename,
					linkedId: newTaskId
				}
			: null,
		formFields: formFieldsWithObjectIdVariables,
		isStructuredOutput,
		variableIds: (variableIds || []).map(toObjectId),
		dateCreated: new Date(),
		taskOutputVariableName
	});

	if (variableIds && variableIds.length > 0) {
		const updatePromises = variableIds.map(async (id: string) => {
			const variable = await getVariableById(req.params.resourceSlug, id);
			const updatedVariable = {
				...variable,
				usedInTasks: [...(variable.usedInTasks || []), addedTask.insertedId]
			};
			return updateVariable(req.params.resourceSlug, id, updatedVariable);
		});
		await Promise.all(updatePromises);
	}

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
			{
				field: 'variableIds',
				validation: {
					hasLength: 24,
					asArray: true,
					ofType: 'string',
					customError: 'Invalid Variables'
				}
			},
			{ field: 'asyncExecution', validation: { ofType: 'boolean' } },
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
		description,
		expectedOutput,
		toolIds,
		asyncExecution,
		agentId,
		context,
		storeTaskOutput,
		taskOutputFileName,
		formFields,
		isStructuredOutput,
		displayOnlyFinalOutput,
		variableIds,
		taskOutputVariableName
	} = req.body;

	const formattedTaskOutputFileName = taskOutputFileName && taskOutputFileName.replace(/\s+/g, '_');

	const task = await getTaskById(req.params.resourceSlug, req.params.taskId);
	if (!task) {
		return dynamicResponse(req, res, 400, { error: 'Invalid task ID, task does not exist' });
	}

	if (agentId) {
		const foundAgent = await getAgentById(req.params.resourceSlug, agentId);
		if (!foundAgent) {
			return dynamicResponse(req, res, 400, { error: 'Invalid agent, agent not found' });
		}
	}

	if (toolIds) {
		if (!Array.isArray(toolIds) || toolIds.some(id => typeof id !== 'string')) {
			return dynamicResponse(req, res, 400, { error: 'Invalid tools list input' });
		}
		// Note: will not return tools with a state of ToolState.PENDING or ToolState.ERROR
		const foundReadyTools = await getReadyToolsById(req.params.resourceSlug, toolIds);
		if (!foundReadyTools || foundReadyTools?.length !== toolIds.length) {
			return dynamicResponse(req, res, 400, { error: 'Invalid tools list input, tool not found' });
		}
	}

	const existingTask = await getTaskById(req.params.resourceSlug, req.params.taskId);
	const existingVariableIds = new Set((existingTask?.variableIds || []).map(v => v.toString()));
	const newVariableIds = new Set(variableIds);
	const newVariableIdsArray = Array.from([...existingVariableIds, ...newVariableIds]);

	const existingVariablePromises = newVariableIdsArray.map(async (id: string) => {
		const variable = await getVariableById(req.params.resourceSlug, id);
		if (!variable) {
			throw new Error(`Variable with ID ${id} not found`);
		}
	});

	try {
		await Promise.all(existingVariablePromises);
	} catch (error) {
		return dynamicResponse(req, res, 400, { error: error.message });
	}

	if (newVariableIdsArray.length > 0) {
		const updatePromises = newVariableIdsArray.map(async (id: string) => {
			const variable = await getVariableById(req.params.resourceSlug, id);
			const usedInTasks = variable?.usedInTasks
				? new Set(variable.usedInTasks?.map(v => v.toString()))
				: new Set([]);

			if (existingVariableIds.has(id) && !newVariableIds.has(id)) {
				usedInTasks.delete(req.params.taskId);
			} else if (!existingVariableIds.has(id) && newVariableIds.has(id)) {
				usedInTasks.add(req.params.taskId);
			}

			const updatedVariable = {
				...variable,
				usedInTasks: Array.from(usedInTasks, id => toObjectId(id))
			};
			return updateVariable(req.params.resourceSlug, id, updatedVariable);
		});

		await Promise.all(updatePromises);
	}

	const formFieldsWithObjectIdVariables = formFields.map(field => ({
		...field,
		variable: toObjectId(field.variable)
	}));

	await updateTask(req.params.resourceSlug, req.params.taskId, {
		name,
		description,
		expectedOutput,
		toolIds: toolIds ? toolIds.map(toObjectId) : [],
		context: context ? context.map(toObjectId) : [],
		asyncExecution: asyncExecution === true,
		requiresHumanInput: requiresHumanInput === true,
		displayOnlyFinalOutput: displayOnlyFinalOutput === true,
		storeTaskOutput: storeTaskOutput === true,
		taskOutputFileName: formattedTaskOutputFileName,
		agentId: agentId ? toObjectId(agentId) : null,
		formFields: formFieldsWithObjectIdVariables,
		isStructuredOutput,
		variableIds: (variableIds || []).map(toObjectId),
		taskOutputVariableName
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
		return dynamicResponse(req, res, 400, { error: 'Invalid task ID' });
	}

	const task = await getTaskById(req.params.resourceSlug, taskId);

	const updateVariablePromises = task.variableIds.map(async (id: string) => {
		const variable = await getVariableById(req.params.resourceSlug, id);
		const usedInTasks = variable?.usedInTasks.map(a => a.toString());
		if (usedInTasks?.length > 0) {
			const newUsedInTasks = usedInTasks.filter(a => a !== taskId);
			return updateVariable(req.params.resourceSlug, id, {
				usedInTasks: newUsedInTasks.map(a => toObjectId(a))
			});
		}
		return null;
	});

	await Promise.all([
		deleteTaskById(req.params.resourceSlug, taskId),
		...updateVariablePromises
		//TODO: reference handling?
	]);

	return dynamicResponse(req, res, 302, {});
}
