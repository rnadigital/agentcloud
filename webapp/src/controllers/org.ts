'use strict';

import { dynamicResponse } from '@dr';
import { editAccountsOrg, getAccountOrgMember, getAccountById } from 'db/account';
import { editOrg, getAllOrgMembers, getOrgById, setMemberPermissions } from 'db/org';
import { chainValidations } from 'utils/validationutils';
import { calcPerms } from '@mw/auth/setpermissions';
import { OrgRoles } from 'lib/permissions/roles';
import Permission from 'lib/permissions/Permission';
import { ORG_BITS } from 'lib/permissions/bits';

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

export async function memberEditPage(app, req, res, next) {
	const data = await orgMemberData(req, res, next);
	console.log('data', data)
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

	if (memberId === res.locals.matchingOrg.ownerId.toString()) {
		return dynamicResponse(req, res, 400, { error: "Org owner permissions can't be edited" });
	}

	console.log(template, OrgRoles)

	if (template && !OrgRoles[template]) {
		return dynamicResponse(req, res, 400, { error: 'Invalid template' });
	}

	const editingMember = await getAccountById(req.params.memberId);

	console.log('template', template)
	console.log('OrgRoles[template]', OrgRoles[template])

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
