'use strict';

import getSpecification from 'airbyte/getspecification';

import { getDatasourceById } from '../db/datasource';
import toObjectId from '../lib/misc/toobjectid';
import { dynamicResponse } from '../util';

/**
 * GET /airbyte/schema
 * team agents json data
 */
export async function specificationJson(req, res, next) {
	if (!req?.query?.sourceDefinitionId || typeof req.query.sourceDefinitionId !== 'string') {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}
	const data = await getSpecification(req, res, next);
	return res.json({ ...data, account: res.locals.account });
}
