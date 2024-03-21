'use strict';

import { dynamicResponse } from '@dr';

const cache = {
	one: {},
	all: {},
	any: {},
};

export function one(requiredPermission) {
	return cache.one[requiredPermission] || (cache.one[requiredPermission] = function(req, res, next) {
		if (!res.locals.permissions.get(requiredPermission)) {
			return dynamicResponse(req, res, 400, { error: 'No permission' });
		}
		next();
	});
}

export function all(...requiredPermissions) {
	const cacheKey: string = requiredPermissions.join(',');
	return cache.all[cacheKey] || (cache.all[cacheKey] = function(req, res, next) {
		if (!res.locals.permissions.hasAll(...requiredPermissions)) {
			return dynamicResponse(req, res, 400, { error: 'No permission' });
		}
		next();
	});
}

export function any(...requiredPermissions) {
	const cacheKey: string = requiredPermissions.join(',');
	return cache.any[cacheKey] || (cache.any[cacheKey] = function(req, res, next) {
		if (!res.locals.permissions.hasAny(...requiredPermissions)) {
			return dynamicResponse(req, res, 400, { error: 'No permission' });
		}
		next();
	});
}
