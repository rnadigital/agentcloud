'use strict';

import { dynamicResponse } from '@dr';
import { editAccountsOrg } from 'db/account';
import { editOrg, getAllOrgMembers, getOrgById } from 'db/org';
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

/**
 * @api {post} /forms/team/[memberId]/edit
 * @apiName edit
 * @apiGroup Team
 *
 * @apiParam {String} teamName Name of new team
 */
export async function editOrgApi(req, res) {
	const { teamName } = req.body;

	let validationError = chainValidations(
		req.body,
		[{ field: 'orgName', validation: { notEmpty: true, ofType: 'string' } }],
		{ teamName: 'Org Name' }
	);

	if (validationError) {
		return dynamicResponse(req, res, 400, { error: validationError });
	}

	await Promise.all([
		editOrg(req.params.resourceSlug, {
			name: teamName
		}),
		editAccountsOrg(res.locals.matchingOrg.id, {
			name: teamName
		})
	]);

	return dynamicResponse(req, res, 200, {});
}
