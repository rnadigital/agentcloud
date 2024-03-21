'use strict';

import { dynamicResponse } from '@dr';
import Permission from '@permission';
import getAirbyteApi, { AirbyteApiType } from 'airbyte/api';
import bcrypt from 'bcrypt';
import createAccount from 'lib/account/create';
import toObjectId from 'misc/toobjectid';
import { Binary, ObjectId } from 'mongodb';
import { TEAM_BITS } from 'permissions/bits';
import Permissions from 'permissions/permissions';
import Roles from 'permissions/roles';

import { Account, addAccount, changeAccountPassword, getAccountByEmail,
	getAccountById, 	getAccountTeamMember, OAuthRecordType, pushAccountOrg,
	pushAccountTeam, setCurrentTeam, verifyAccount } from '../db/account';
import { addOrg, getOrgById } from '../db/org';
import { addTeam, addTeamMember, getTeamById, getTeamWithMembers, removeTeamMember, setMemberPermissions } from '../db/team';
import { addVerification, getAndDeleteVerification,VerificationTypes } from '../db/verification';
import * as ses from '../lib/email/ses';

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
	let foundAccount = await getAccountByEmail(email);
	const invitingTeam = res.locals.matchingOrg.teams
		.find(t => t.id.toString() === req.params.resourceSlug);
	if (!foundAccount) {
		const { addedAccount } = await createAccount(email, name, null, true);
		await addTeamMember(req.params.resourceSlug, addedAccount.insertedId);
		foundAccount = await getAccountByEmail(email);
	} else {
		//account with that email was found
		const foundTeam = await getTeamById(req.params.resourceSlug);
		if (foundTeam.members.some(tmid => tmid.toString() === foundAccount._id.toString())) {
			return dynamicResponse(req, res, 403, { error: 'User is already on your team' });
		}
		await addTeamMember(req.params.resourceSlug, foundAccount._id);
	}
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
	//member invited
	return dynamicResponse(req, res, 200, { });
}

/**
 * @api {delete} /forms/team/invite
 * @apiName invite
 * @apiGroup Team
 *
 * @apiParam {String} email Email of person to invite
 */
export async function deleteTeamMemberApi(req, res) {
	const { memberId } = req.body;
	//account with that memberId
	const memberAccount = await getAccountById(memberId);
	if (memberAccount) {	
		const foundTeam = await getTeamById(req.params.resourceSlug);
		const org = res.locals.matchingOrg;//await getOrgById(foundTeam.orgId);
		if (!org) {
			return dynamicResponse(req, res, 403, { error: 'User org not found' });
		} else {
			if (!foundTeam.members.some(m => m.equals(memberAccount._id))) {
				return dynamicResponse(req, res, 403, { error: 'Cannot remove org user' });
			}
		}
		// if (!foundTeam.members.some(m => m.equals(memberAccount._id))) {
		// 	return dynamicResponse(req, res, 403, { error: 'User not found in your team' });
		// }
		const removeRes = await removeTeamMember(req.params.resourceSlug, memberId.toString());
		if (removeRes?.modifiedCount < 1) {
			return dynamicResponse(req, res, 403, { error: 'User not found in your team' });
		}
	} else {
		return dynamicResponse(req, res, 403, { error: 'User not found' });
	}
	return dynamicResponse(req, res, 302, {  });
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
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}
	const addedTeam = await addTeam({
		name: teamName,
		ownerId: toObjectId(res.locals.account._id),
		orgId: toObjectId(res.locals.matchingOrg.id),
		members: [toObjectId(res.locals.account._id)],
		dateCreated: new Date(),
		permissions: {
			[res.locals.account._id.toString()]: new Binary((new Permission(Roles.REGISTERED_USER.base64).array)),
		}
	});
	await addTeamMember(addedTeam.insertedId, res.locals.account._id);
	await pushAccountTeam(res.locals.account._id, res.locals.matchingOrg.id, {
		id: addedTeam.insertedId,
		name: teamName,
		ownerId: toObjectId(res.locals.account._id),
	});
	return dynamicResponse(req, res, 200, { _id: addedTeam.insertedId, orgId: res.locals.matchingOrg.id });
}

/**
 * @api {post} /forms/team/[memberId]/edit
 * @apiName edit
 * @apiGroup Team
 *
 * @apiParam {String} teamName Name of new team
 */
export async function editTeamMemberApi(req, res) {

	const { resourceSlug, memberId } = req.params;
	const { template } = req.body;
	
	if (memberId === res.locals.matchingTeam.ownerId.toString()) {
		return dynamicResponse(req, res, 400, { error: 'Team owner permissions can\'t be edited' });
	}

	const editingMember = await getAccountById(req.params.memberId);
	let updatingPermissions;
	if (template) {
		updatingPermissions = new Permission(template); //TODO: template (.base64 of official roles)
	} else {
		updatingPermissions = new Permission(/* TODO: PERMISSIONS OF THE PERSON BEING EDITED */);
		updatingPermissions.handleBody(req.body, res.locals.permissions, TEAM_BITS);
	}

	await setMemberPermissions(resourceSlug, memberId, updatingPermissions);

	return dynamicResponse(req, res, 200, { });

}

export async function teamMemberData(req, res, _next) {
	const [teamMember] = await Promise.all([
		getAccountTeamMember(req.params.accountId, req.params.resourceSlug),
	]);
	return {
		teamMember,
		csrf: req.csrfToken(),
	};
};

/**
 * GET /[resourceSlug]/team/[memberId]/edit
 * edit team member page html
 */
export async function memberEditPage(app, req, res, next) {
	const data = await teamMemberData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/team/${req.params.memberId}/edit`);
}
