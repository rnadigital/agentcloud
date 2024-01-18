'use strict';

import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { addTeam, getTeamById, getTeamWithMembers, addTeamMember } from '../db/team';
import { VerificationTypes, addVerification, getAndDeleteVerification } from '../db/verification';
import { OAuthRecordType, setCurrentTeam, getAccountByEmail, changeAccountPassword, addAccount,
	Account, verifyAccount, pushAccountOrg, pushAccountTeam } from '../db/account';
import { addOrg } from '../db/org';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import { dynamicResponse } from '../util';
import toObjectId from 'misc/toobjectid';
import * as ses from '../lib/email/ses';
import createAccount from 'lib/account/create';

export async function teamData(req, res, _next) {
	const [team] = await Promise.all([
		getTeamWithMembers(req.params.resourceSlug),
	]);
	return {
		team,
		csrf: req.csrfToken(),
	};
};

/**
 * GET /[resourceSlug]/team
 * team/invites page html
 */
export async function teamPage(app, req, res, next) {
	const data = await teamData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/team`);
}

/**
 * GET /team.json
 * team/invites page json data
 */
export async function teamJson(req, res, next) {
	const data = await teamData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
 * @api {post} /forms/team/invite
 * @apiName invite
 * @apiGroup Team
 *
 * @apiParam {String} email Email of person to invite
 */
export async function inviteTeamMemberApi(req, res) {
	const { name, email } = req.body;
	if (!email || typeof email !== 'string' || email.length === 0) {
		return dynamicResponse(req, res, 403, { error: 'Invalid inputs' });
	}
	const foundAccount = await getAccountByEmail(email);
	const invitingTeam = res.locals.matchingOrg.teams
		.find(t => t.id.toString() === req.params.resourceSlug);
	if (!foundAccount) {
		const { addedAccount } = await createAccount(email, name, null, true);
		await addTeamMember(req.params.resourceSlug, addedAccount.insertedId);
	} else {
		//account with that email was found
		const foundTeam = await getTeamById(req.params.resourceSlug);
		if (foundTeam.members.includes(foundAccount._id)) {
			return dynamicResponse(req, res, 403, { error: 'User is already on your team' });
		}
		await addTeamMember(req.params.resourceSlug, foundAccount._id);
		if (!foundAccount.orgs.find(f => f.id === res.locals.matchingOrg.id)) {
			//if user isnt in org, add the new org to their account array with the invitingTeam already pushed
			await pushAccountOrg(foundAccount._id, {
				...res.locals.matchingOrg,
				teams: [invitingTeam],
			});
		} else {
			//otherwise theyre already in the org, just push the single team to the matching org
			await pushAccountTeam(foundAccount._id, res.locals.matchingOrg.id, invitingTeam);
		}
	}
	//member invited
	return dynamicResponse(req, res, 302, { redirect: `/${req.params.resourceSlug}/team` });
}

/**
 * @api {post} /forms/team/add
 * @apiName add
 * @apiGroup Team
 *
 * @apiParam {String} teamName Name of new team
 */
export async function addTeamApi(req, res) {
	const { teamName } = req.body;
	if (!teamName || typeof teamName !== 'string' || teamName.length === 0) {
		return dynamicResponse(req, res, 403, { error: 'Invalid inputs' });
	}
	let airbyteWorkspaceId = null;
	if (process.env.AIRBYTE_USERNAME) {
		const workspaceApi = await getAirbyteApi(AirbyteApiType.WORKSPACES);
		const workspace = await workspaceApi.createWorkspace(null, {
			name: res.locals.account._id.toString(), // account _id stringified as workspace nam
		}).then(res => res.data);
		airbyteWorkspaceId = workspace.workspaceId;
	}
	const addedTeam = await addTeam({
		name: teamName,
		orgId: toObjectId(res.locals.matchingOrg.id),
		members: [toObjectId(res.locals.account._id)],
		airbyteWorkspaceId,
	});
	await addTeamMember(addedTeam.insertedId, res.locals.account._id);
	await pushAccountTeam(res.locals.account._id, res.locals.matchingOrg.id, {
		id: addedTeam.insertedId,
		name: teamName,
	});
	return dynamicResponse(req, res, 200, { _id: addedTeam.insertedId, orgId: res.locals.matchingOrg.id });
}

//TODO: delete pending invite
//TODO: remove from team
