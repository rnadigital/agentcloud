import { describe, expect, test } from '@jest/globals';
import { relativeString } from './time';

const now = new Date('2024-08-01T12:00:00Z');

const SECOND = 1000;
const MINUTE = 60000;
const HOUR = 3600000;
const DAY = 86400000;
const WEEK = 604800000;
const MONTH = 2629800000;
const YEAR = 31536000000;

const testCases = [
	{ relativeTo: new Date(now.getTime() - 30 * SECOND), expected: 'Just now' },
	{ relativeTo: new Date(now.getTime() - 59 * MINUTE), expected: '59 minutes ago' },
	{ relativeTo: new Date(now.getTime() - HOUR), expected: '1 hour ago' },
	{ relativeTo: new Date(now.getTime() - DAY), expected: '1 day ago' },
	{ relativeTo: new Date(now.getTime() - WEEK), expected: '1 week ago' },
	{ relativeTo: new Date(now.getTime() - 2 * WEEK), expected: '2 weeks ago' },
	{ relativeTo: new Date(now.getTime() - MONTH), expected: '1 month ago' },
	{ relativeTo: new Date(now.getTime() - YEAR), expected: '1 year ago' },
	{ relativeTo: new Date(now.getTime() + 30 * SECOND), expected: 'Just now' },
	{ relativeTo: new Date(now.getTime() + 59 * MINUTE), expected: '59 minutes from now' },
	{ relativeTo: new Date(now.getTime() + HOUR), expected: '1 hour from now' },
	{ relativeTo: new Date(now.getTime() + DAY), expected: '1 day from now' },
	{ relativeTo: new Date(now.getTime() + WEEK), expected: '1 week from now' },
	{ relativeTo: new Date(now.getTime() + 2 * WEEK), expected: '2 weeks from now' },
	{ relativeTo: new Date(now.getTime() + MONTH), expected: '1 month from now' },
	{ relativeTo: new Date(now.getTime() + YEAR), expected: '1 year from now' },

	// 25% and 75% tests for rounding
	{ relativeTo: new Date(now.getTime() - Math.floor(0.25 * HOUR)), expected: '15 minutes ago' },
	{ relativeTo: new Date(now.getTime() - Math.floor(0.75 * HOUR)), expected: '45 minutes ago' },
	{ relativeTo: new Date(now.getTime() - Math.floor(0.25 * DAY)), expected: '6 hours ago' },
	{ relativeTo: new Date(now.getTime() - Math.floor(0.75 * DAY)), expected: '18 hours ago' },
	{ relativeTo: new Date(now.getTime() - Math.floor(0.25 * WEEK)), expected: '2 days ago' },
	{ relativeTo: new Date(now.getTime() - Math.floor(0.75 * WEEK)), expected: '5 days ago' },
	{ relativeTo: new Date(now.getTime() - Math.floor(0.25 * MONTH)), expected: '1 week ago' },
	{ relativeTo: new Date(now.getTime() - Math.floor(0.75 * MONTH)), expected: '3 weeks ago' },
	{ relativeTo: new Date(now.getTime() - Math.floor(0.25 * YEAR)), expected: '3 months ago' },
	{ relativeTo: new Date(now.getTime() - Math.floor(0.75 * YEAR)), expected: '9 months ago' },

	{ relativeTo: new Date(now.getTime() + Math.floor(0.25 * HOUR)), expected: '15 minutes from now' },
	{ relativeTo: new Date(now.getTime() + Math.floor(0.75 * HOUR)), expected: '45 minutes from now' },
	{ relativeTo: new Date(now.getTime() + Math.floor(0.25 * DAY)), expected: '6 hours from now' },
	{ relativeTo: new Date(now.getTime() + Math.floor(0.75 * DAY)), expected: '18 hours from now' },
	{ relativeTo: new Date(now.getTime() + Math.floor(0.25 * WEEK)), expected: '2 days from now' },
	{ relativeTo: new Date(now.getTime() + Math.floor(0.75 * WEEK)), expected: '5 days from now' },
	{ relativeTo: new Date(now.getTime() + Math.floor(0.25 * MONTH)), expected: '1 week from now' },
	{ relativeTo: new Date(now.getTime() + Math.floor(0.75 * MONTH)), expected: '3 weeks from now' },
	{ relativeTo: new Date(now.getTime() + Math.floor(0.25 * YEAR)), expected: '3 months from now' },
	{ relativeTo: new Date(now.getTime() + Math.floor(0.75 * YEAR)), expected: '9 months from now' },
];

describe('Test relativeString() util', () => {
	for (let { relativeTo, expected } of testCases) {
		test(`Test relativeString(${now.toISOString()}, ${relativeTo.toISOString()}) -> ${expected}`, () => {
			expect(relativeString(now, relativeTo)).toBe(expected);
		});
	}
});
