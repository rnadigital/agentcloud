'use strict';

import * as db from 'db/index';
import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { InsertResult } from 'struct/db';
import { Task } from 'struct/task'; // Adjust the import path as necessary

export function TaskCollection(): any {
	return db.db().collection('tasks');
}

export function getTaskById(teamId: db.IdOrStr, taskId: db.IdOrStr): Promise<Task> {
	return TaskCollection().findOne({
		_id: toObjectId(taskId),
		teamId: toObjectId(teamId)
	});
}

export function getTaskByName(teamId: db.IdOrStr, taskName: string): Promise<Task> {
	return TaskCollection().findOne({
		name: taskName,
		teamId: toObjectId(teamId)
	});
}

export function getTasksByTeam(teamId: db.IdOrStr): Promise<Task[]> {
	return TaskCollection()
		.find({
			teamId: toObjectId(teamId)
		})
		.toArray();
}

export function getTasksByOrg(teamId: db.IdOrStr): Promise<Task[]> {
	return TaskCollection()
		.find({
			teamId: toObjectId(teamId)
		})
		.toArray();
}

export async function addTask(task: Task): Promise<InsertResult> {
	return TaskCollection().insertOne(task);
}

export async function updateTask(
	teamId: db.IdOrStr,
	taskId: db.IdOrStr,
	task: Partial<Task>
): Promise<InsertResult> {
	return TaskCollection().updateOne(
		{
			_id: toObjectId(taskId),
			teamId: toObjectId(teamId)
		},
		{
			$set: task
		}
	);
}

export function deleteTaskById(teamId: db.IdOrStr, taskId: db.IdOrStr): Promise<any> {
	return TaskCollection().deleteOne({
		_id: toObjectId(taskId),
		teamId: toObjectId(teamId)
	});
}
