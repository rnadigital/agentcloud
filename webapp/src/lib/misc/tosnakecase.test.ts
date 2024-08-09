import { describe, expect, test } from '@jest/globals';

import toSnakeCase from './tosnakecase';

const testCases = [{ in: 'THIS IS A TEST', out: 'this_is_a_test' }];

describe('Test toSnakeCase() util', () => {
	for (let t of testCases) {
		test(`Test toSnakeCase(${t.in}) -> ${t.out}`, () => {
			expect(toSnakeCase('THIS IS A TEST')).toBe('this_is_a_test');
		});
	}
});
