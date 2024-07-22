'use strict';

import * as db from 'db/index';
import toObjectId from 'misc/toobjectid';
import { ObjectId } from 'mongodb';
import { Crew } from 'struct/crew';
import { InsertResult } from 'struct/db';

export function CrewCollection(): any {
	return db.db().collection('crews');
}

export function getCrewById(teamId: db.IdOrStr, crewId: db.IdOrStr): Promise<Crew> {
	return CrewCollection().findOne({
		_id: toObjectId(crewId),
		teamId: toObjectId(teamId)
	});
}

export function unsafeGetCrewById(crewId: db.IdOrStr): Promise<Crew> {
	return CrewCollection().findOne({
		_id: toObjectId(crewId)
	});
}

export function getCrewsByTeam(teamId: db.IdOrStr): Promise<Crew[]> {
	return CrewCollection()
		.find({
			teamId: toObjectId(teamId)
		})
		.toArray();
}

export function getCrewsWithAgent(teamId: db.IdOrStr, agentId: db.IdOrStr): Promise<Crew[]> {
	return CrewCollection()
		.find({
			teamId: toObjectId(teamId),
			agents: toObjectId(agentId)
		})
		.toArray();
}

export async function addCrew(crew: Crew): Promise<InsertResult> {
	return CrewCollection().insertOne(crew);
}

export async function updateCrew(
	teamId: db.IdOrStr,
	crewId: db.IdOrStr,
	crew: Crew
): Promise<InsertResult> {
	return CrewCollection().updateOne(
		{
			_id: toObjectId(crewId),
			teamId: toObjectId(teamId)
		},
		{
			$set: crew
		}
	);
}

export function removeAgentFromCrews(teamId: db.IdOrStr, agentId: db.IdOrStr): Promise<any> {
	return CrewCollection().updateMany(
		{
			agents: toObjectId(agentId),
			teamId: toObjectId(teamId)
		},
		{
			$pull: {
				agents: toObjectId(agentId)
			}
		}
	);
}

export function deleteCrewById(teamId: db.IdOrStr, crewId: db.IdOrStr): Promise<any> {
	return CrewCollection().deleteOne({
		_id: toObjectId(crewId),
		teamId: toObjectId(teamId)
	});
}
