'use strict';

import { dynamicResponse } from '@dr';
import Metadata from 'permissions/metadata';

const cache = {
	one: {},
	all: {},
	any: {}
};

export function one(requiredPermission) {
	return (
		cache.one[requiredPermission] ||
		(cache.one[requiredPermission] = function (req, res, next) {
			if (!res.locals.permissions.get(requiredPermission)) {
				return dynamicResponse(req, res, 403, {
					error: `Missing permission "${Metadata[requiredPermission].title}"`
				});
			}
			next();
		})
	);
}

export function all(...requiredPermissions) {
	const cacheKey: string = requiredPermissions.join(',');
	return (
		cache.all[cacheKey] ||
		(cache.all[cacheKey] = function (req, res, next) {
			if (!res.locals.permissions.hasAll(...requiredPermissions)) {
				return dynamicResponse(req, res, 403, { error: 'No permission' });
			}
			next();
		})
	);
}

export function any(...requiredPermissions) {
	const cacheKey: string = requiredPermissions.join(',');
	return (
		cache.any[cacheKey] ||
		(cache.any[cacheKey] = function (req, res, next) {
			if (!res.locals.permissions.hasAny(...requiredPermissions)) {
				return dynamicResponse(req, res, 403, { error: 'No permission' });
			}
			next();
		})
	);
}
