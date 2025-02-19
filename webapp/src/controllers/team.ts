'use strict';

import { dynamicResponse } from '@dr';
import Permission from '@permission';
import {
	editAccountsTeam,
	getAccountByEmail,
	getAccountById,
	getAccountTeamMember,
	pullAccountTeam,
	pushAccountOrg,
	pushAccountTeam,
	updateTeamOwnerInAccounts
} from 'db/account';
import {
	addTeam,
	addTeamMember,
	editTeam,
	getTeamById,
	getTeamWithMembers,
	getTeamWithModels,
	removeTeamMember,
	setDefaultModel,
	setMemberPermissions,
	updateTeamOwner
} from 'db/team';
import createAccount from 'lib/account/create';
import { calcPerms } from 'lib/middleware/auth/setpermissions';
import VectorDBProxyClient from 'lib/vectorproxy/client';
import toObjectId from 'misc/toobjectid';
import { Binary } from 'mongodb';
import { TEAM_BITS } from 'permissions/bits';
import Permissions from 'permissions/permissions';
import { TeamRoles } from 'permissions/roles';
import { SubscriptionPlan } from 'struct/billing';
import { chainValidations } from 'utils/validationutils';

export async function teamData(req, res, _next) {
	const team = await getTeamWithMembers(req.params.resourceSlug);
	return {
		team,
		csrf: req.csrfToken()
	};
}

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

export async function teamModelsJson(req, res, next) {
	const data = await getTeamWithModels(req.params.resourceSlug);
	const csrf = req.csrfToken();

	return res.json({ data, csrf, account: res.locals.account });
}

export async function vectorStorageJson(req, res, next) {
	const data = await VectorDBProxyClient.getVectorStorageForTeam(req.params.resourceSlug);
	const csrf = req.csrfToken();

	return res.json({ data, csrf, account: res.locals.account, team: req.params.resourceSlug });
}

/**
 * @api {post} /forms/team/invite
 * @apiName invite
 * @apiGroup Team
 *
 * @apiParam {String} email Email of person to invite
 */
export async function inviteTeamMemberApi(req, res) {
	let validationError = chainValidations(
		req.body,
		[
			{ field: 'name', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'email', validation: { notEmpty: true, ofType: 'string' } },
			{ field: 'template', validation: { notEmpty: true, inSet: new Set(Object.keys(TeamRoles)) } }
		],
		{ name: 'Name', email: 'Email', template: 'Template' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const { name, email, template } = req.body;

	let foundAccount = await getAccountByEmail(email);

	const invitingTeam = res.locals.matchingOrg.teams.find(
		t => t.id.toString() === req.params.resourceSlug
	);
	if (!foundAccount) {
		const { addedAccount } = await createAccount({
			email,
			name,
			roleTemplate: template,
			invite: true,
			teamName: invitingTeam.name,
			invitingTeamId: invitingTeam.id,
			invitingOrgId: res.locals.matchingOrg.id
		});
		await addTeamMember(req.params.resourceSlug, addedAccount.insertedId, template);
		foundAccount = await getAccountByEmail(email);
	} else {
		//account with that email was found
		const foundTeam = await getTeamById(req.params.resourceSlug);
		if (foundTeam.members.some(tmid => tmid.toString() === foundAccount._id.toString())) {
			return dynamicResponse(req, res, 409, { error: 'User is already on your team' });
		}
		await addTeamMember(req.params.resourceSlug, foundAccount._id, template);
	}
	const alreadyInOrg = foundAccount.orgs.find(
		f => f.id.toString() === res.locals.matchingOrg.id.toString()
	);
	const alreadyInTeam =
		alreadyInOrg && alreadyInOrg.teams.find(t => t.id.toString() === invitingTeam.id.toString());
	if (!alreadyInOrg) {
		//if user isnt in org, add the new org to their account array with the invitingTeam already pushed
		await pushAccountOrg(foundAccount._id, {
			...res.locals.matchingOrg,
			teams: [invitingTeam]
		});
	} else if (alreadyInOrg && !alreadyInTeam) {
		//otherwise theyre already in the org, just push the single team to the matching org
		await pushAccountTeam(foundAccount._id, res.locals.matchingOrg.id, invitingTeam);
	}
	//member invited
	return dynamicResponse(req, res, 200, {});
}

/**
 * @api {delete} /forms/team/invite
 * @apiName invite
 * @apiGroup Team
 *
 * @apiParam {String} email Email of person to invite
 */
export async function deleteTeamMemberApi(req, res) {
	let validationError = chainValidations(
		req.body,
		[{ field: 'memberId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } }],
		{ memberId: 'Member ID' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const { memberId } = req.body;
	const memberAccount = await getAccountById(memberId);
	if (memberAccount) {
		const removeRes = await removeTeamMember(req.params.resourceSlug, memberId.toString());
		if (removeRes?.modifiedCount < 1) {
			return dynamicResponse(req, res, 403, { error: 'User not found in your team' });
		}
		await pullAccountTeam(memberId, res.locals.matchingOrg.id, req.params.resourceSlug);
	} else {
		return dynamicResponse(req, res, 403, { error: 'User not found' });
	}

	return dynamicResponse(req, res, 200, {});
}

/**
 * @api {post} /forms/team/add
 * @apiName add
 * @apiGroup Team
 *
 * @apiParam {String} teamName Name of new team
 */
export async function addTeamApi(req, res) {
	let validationError = chainValidations(
		req.body,
		[{ field: 'teamName', validation: { notEmpty: true, ofType: 'string' } }],
		{ teamName: 'Team Name' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

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
			[res.locals.account._id.toString()]: new Binary(
				new Permission(TeamRoles.TEAM_ADMIN.base64).array
			)
		}
	});
	await addTeamMember(addedTeam.insertedId, res.locals.account._id);
	await pushAccountTeam(res.locals.account._id, res.locals.matchingOrg.id, {
		id: addedTeam.insertedId,
		name: teamName,
		ownerId: toObjectId(res.locals.account._id)
	});
	return dynamicResponse(req, res, 200, {
		_id: addedTeam.insertedId,
		orgId: res.locals.matchingOrg.id
	});
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
	let { stripePlan } = res.locals.account?.stripe || {};

	if (memberId === res.locals.matchingTeam.ownerId.toString()) {
		return dynamicResponse(req, res, 400, { error: "Team owner permissions can't be edited" });
	}

	if (!template && stripePlan !== SubscriptionPlan.ENTERPRISE) {
		//Only enterprise can NOT includea template which means it goes to Permission.handleBody V
		return dynamicResponse(req, res, 400, { error: 'Missing role' });
	}

	if (template && !TeamRoles[template]) {
		return dynamicResponse(req, res, 400, { error: 'Invalid template' });
	}

	const editingMember = await getAccountById(req.params.memberId);

	let updatingPermissions;
	if (template) {
		updatingPermissions = new Permission(TeamRoles[template].base64);
	} else {
		updatingPermissions = new Permission(editingMember.permissions.toString('base64'));
		updatingPermissions.handleBody(req.body, res.locals.permissions, TEAM_BITS);
	}
	await setMemberPermissions(resourceSlug, memberId, updatingPermissions);

	//For the bits that are org level, set those in the org map
	// await setOrgPermissions(resourceSlug, memberId, updatingPermissions);

	return dynamicResponse(req, res, 200, {});
}

export async function editTeamApi(req, res) {
	const { teamName } = req.body;

	let validationError = chainValidations(
		req.body,
		[{ field: 'teamName', validation: { notEmpty: true, ofType: 'string' } }],
		{ teamName: 'Team Name' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	await Promise.all([
		editTeam(req.params.resourceSlug, {
			name: teamName
		}),
		editAccountsTeam(req.params.resourceSlug, res.locals.matchingOrg.id, {
			name: teamName
		})
	]);

	return dynamicResponse(req, res, 200, {});
}

export async function teamMemberData(req, res, _next) {
	const [teamMember] = await Promise.all([
		getAccountTeamMember(req.params.memberId, req.params.resourceSlug)
	]);
	teamMember.permissions = calcPerms(
		teamMember,
		res.locals.matchingOrg,
		res.locals.matchingTeam
	).base64;
	return {
		teamMember,
		csrf: req.csrfToken()
	};
}

/**
 * GET /[resourceSlug]/team/[memberId].json
 * team member json data
 */
export async function teamMemberJson(req, res, next) {
	const data = await teamMemberData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

/**
 * GET /[resourceSlug]/team/[memberId]/edit
 * edit team member page html
 */
export async function memberEditPage(app, req, res, next) {
	const data = await teamMemberData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/team/${req.params.memberId}/edit`);
}

/**
 * @api {post} /forms/team/transfer-ownership Transfer Team Ownership
 * @apiName TransferTeamOwnership
 * @apiGroup Team
 *
 * @apiParam {String} resourceSlug The ID of the team.
 * @apiParam {String} newOwnerId The ID of the new owner.
 * @apiParam {String} _csrf CSRF token for security.
 *
 * @apiPermission ORG_OWNER, TEAM_OWNER
 *
 * @apiSuccess {String} message Success message indicating the team owner was updated.
 *
 * @apiError {String} error Error message detailing the failure.
 *
 */
export async function transferTeamOwnershipApi(req, res) {
	let validationError = chainValidations(
		req.body,
		[{ field: 'newOwnerId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } }],
		{ newOwnerId: 'New Owner ID' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const { resourceSlug } = req.params;
	const { newOwnerId } = req.body;

	if (newOwnerId === res.locals.matchingTeam.ownerId.toString()) {
		return dynamicResponse(req, res, 409, { error: 'User is already team owner' });
	}
	if (
		res.locals.account._id.toString() !== res.locals.matchingTeam.ownerId.toString() &&
		!res.locals.permissions.get(Permissions.ORG_OWNER)
	) {
		return dynamicResponse(req, res, 403, { error: 'Permission denied' });
	}
	const newOwner = await getAccountById(newOwnerId);
	if (!newOwner) {
		return dynamicResponse(req, res, 404, { error: 'New owner not found' });
	}
	await Promise.all([
		updateTeamOwner(resourceSlug, newOwnerId),
		updateTeamOwnerInAccounts(res.locals.matchingOrg.id, resourceSlug, newOwnerId)
	]);
	return dynamicResponse(req, res, 200, { message: 'Team ownership transferred successfully' });
}

export async function setDefaultModelApi(req, res) {
	let validationError = chainValidations(
		req.body,
		[
			{ field: 'modelId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } },
			{ field: 'modelType', validation: { notEmpty: true, inSet: new Set(['llm', 'embedding']) } }
		],
		{ modelId: 'Model ID', modelType: 'Model Type' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const { modelId, modelType } = req.body;

	if (modelId && modelType) {
		await setDefaultModel(req.params.resourceSlug, modelId, modelType);

		return dynamicResponse(req, res, 200, {});
	}

	return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
}
