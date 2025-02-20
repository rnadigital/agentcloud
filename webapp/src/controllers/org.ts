'use strict';

import { dynamicResponse } from '@dr';
import { calcPerms } from '@mw/auth/setpermissions';
import { editAccountsOrg, getAccountById, getAccountOrgMember, pullAccountTeams } from 'db/account';
import {
	editOrg,
	getAllOrgMembers,
	getAllOrgTeams,
	getOrgById,
	setMemberPermissions
} from 'db/org';
import { removeTeamsMember } from 'db/team';
import { ORG_BITS } from 'lib/permissions/bits';
import Permission from 'lib/permissions/Permission';
import { OrgRoles } from 'lib/permissions/roles';
import VectorDBProxyClient from 'lib/vectorproxy/client';
import { SubscriptionPlan } from 'struct/billing';
import { chainValidations } from 'utils/validationutils';

export async function orgData(req, res, _next) {
	const [members, org] = await Promise.all([
		await getAllOrgMembers(req.params.resourceSlug, res.locals.matchingOrg.id),
		await getOrgById(res.locals.matchingOrg.id)
	]);
	return {
		members,
		org,
		csrf: req.csrfToken()
	};
}

/**
 * GET /[resourceSlug]/team
 * team/invites page html
 */
export async function orgPage(app, req, res, next) {
	const data = await orgData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/org`);
}

/**
 * GET /team.json
 * team/invites page json data
 */
export async function orgJson(req, res, next) {
	const data = await orgData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

export async function orgMemberData(req, res, _next) {
	const orgMember = await getAccountOrgMember(req.params.memberId, res.locals.matchingOrg.id);
	orgMember.permissions = calcPerms(
		orgMember,
		res.locals.matchingOrg,
		null //res.locals.matchingTeam
	).base64;
	return {
		orgMember,
		csrf: req.csrfToken()
	};
}

export async function orgMemberJson(req, res, next) {
	const data = await orgMemberData(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}

//get vector storage usage for every team in the org
export async function vectorStorageAllTeams(req, res, next) {
	const data = await getAllOrgTeams(res.locals.matchingOrg.id); //should be all teamIds
	let teamObject = {};
	await Promise.all(
		data.teamIds.map(async teamId => {
			const usageData = await VectorDBProxyClient.getVectorStorageForTeam(teamId);
			teamObject[teamId.toString()] = usageData;
		})
	);

	return res.json({ ...teamObject });
}

export async function memberEditPage(app, req, res, next) {
	const data = await orgMemberData(req, res, next);
	res.locals.data = { ...data, account: res.locals.account };
	return app.render(req, res, `/${req.params.resourceSlug}/org/${req.params.memberId}/edit`);
}

/**
 * @api {post} /forms/team/[memberId]/edit
 * @apiName edit
 * @apiGroup Team
 *
 * @apiParam {String} teamName Name of new team
 */
export async function editOrgApi(req, res) {
	const { orgName } = req.body;

	let validationError = chainValidations(
		req.body,
		[{ field: 'orgName', validation: { notEmpty: true, ofType: 'string' } }],
		{ teamName: 'Org Name' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	await Promise.all([
		editOrg(res.locals.matchingOrg.id, {
			name: orgName
		}),
		editAccountsOrg(res.locals.matchingOrg.id, {
			name: orgName
		})
	]);

	return dynamicResponse(req, res, 200, {});
}

export async function editOrgMemberApi(req, res) {
	const { resourceSlug, memberId } = req.params;
	const { template } = req.body;
	let { stripePlan } = res.locals.account?.stripe || {};

	if (memberId === res.locals.matchingOrg.ownerId.toString()) {
		return dynamicResponse(req, res, 400, { error: "Org owner permissions can't be edited" });
	}

	if (!template && stripePlan !== SubscriptionPlan.ENTERPRISE) {
		//Only enterprise can NOT includea template which means it goes to Permission.handleBody V
		return dynamicResponse(req, res, 400, { error: 'Missing role' });
	}

	if (template && !OrgRoles[template]) {
		return dynamicResponse(req, res, 400, { error: 'Invalid role' });
	}

	const editingMember = await getAccountById(req.params.memberId);

	let updatingPermissions;
	if (template) {
		updatingPermissions = new Permission(OrgRoles[template].base64);
	} else {
		updatingPermissions = new Permission(editingMember.permissions.toString('base64'));
		updatingPermissions.handleBody(req.body, res.locals.permissions, ORG_BITS);
	}
	await setMemberPermissions(res.locals.matchingOrg.id, memberId, updatingPermissions);

	//For the bits that are org level, set those in the org map
	// await setOrgPermissions(resourceSlug, memberId, updatingPermissions);

	return dynamicResponse(req, res, 200, {});
}

export async function deleteOrgMemberApi(req, res) {
	let validationError = chainValidations(
		req.body,
		[{ field: 'memberId', validation: { notEmpty: true, hasLength: 24, ofType: 'string' } }],
		{ memberId: 'Member ID' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	const { memberId } = req.body;
	//account with that memberId
	const memberAccount = await getAccountById(memberId);
	if (memberAccount) {
		const org = res.locals.matchingOrg;
		const orgTeamIds = org.teams.map(t => t.id.toString());
		const [teamsRes, accountRes] = await Promise.all([
			removeTeamsMember(orgTeamIds, res.locals.matchingOrg.id, memberId.toString()),
			pullAccountTeams(memberId, res.locals.matchingOrg.id, orgTeamIds)
		]);
		if (teamsRes?.modifiedCount < 1 && accountRes?.modifiedCount < 1) {
			return dynamicResponse(req, res, 403, { error: 'User not found in your org' });
		}
	} else {
		return dynamicResponse(req, res, 403, { error: 'User not found' });
	}

	return dynamicResponse(req, res, 200, {});
}
