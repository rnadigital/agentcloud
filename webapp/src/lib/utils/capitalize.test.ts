import { describe, expect, test } from '@jest/globals';

import { capitalize } from './capitalize';

const testCases = [
	{ in: 'hello', out: 'Hello' },
	{ in: 'world', out: 'World' },
	{ in: '', out: '' },
	{ in: undefined, out: '' },
	{ in: 'capitalize', out: 'Capitalize' }
];

describe('Test capitalize() util', () => {
	for (let t of testCases) {
		test(`Test capitalize(${t.in}) -> ${t.out}`, () => {
			expect(capitalize(t.in)).toBe(t.out);
		});
	}
});
