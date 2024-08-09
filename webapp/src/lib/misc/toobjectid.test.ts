import { describe, expect, test } from '@jest/globals';
import { ObjectId } from 'mongodb';

import toObjectId from './toobjectid';

const testCases = [
	{ in: '507f1f77bcf86cd799439011', isString: true },
	{ in: new ObjectId('507f1f77bcf86cd799439011'), isString: false },
	{ in: 'invalid-id', isString: true, expectError: true },
];

describe('Test toObjectId() util', () => {
	for (let t of testCases) {
		if (t.expectError) {
			test(`Test toObjectId(${t.in}) throws an error`, () => {
				expect(() => toObjectId(t.in)).toThrow();
			});
		} else {
			test(`Test toObjectId(${t.in}) returns ObjectId`, () => {
				const result = toObjectId(t.in);
				expect(result).toBeInstanceOf(ObjectId);
				if (t.isString) {
					expect(result.toHexString()).toBe(t.in);
				} else {
					expect(result).toBe(t.in);
				}
			});
		}
	}
});
