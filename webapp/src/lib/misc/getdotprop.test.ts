import { describe, expect, test } from '@jest/globals';

import getDotProp from './getdotprop';

const testObject = {
	a: {
		b: {
			c: 'value',
			d: null,
		},
		e: 'another value'
	},
	f: null,
};

const testCases = [
	{ obj: testObject, prop: 'a.b.c', expected: 'value' },
	{ obj: testObject, prop: 'a.b.d', expected: null },
	{ obj: testObject, prop: 'a.e', expected: 'another value' },
	{ obj: testObject, prop: 'f', expected: null },
	{ obj: testObject, prop: 'a.b.x', expected: null },
	{ obj: testObject, prop: 'a.x.c', expected: null },
	{ obj: testObject, prop: '', expected: null },
	{ obj: {}, prop: 'a.b.c', expected: null },
];

describe('Test getDotProp() util', () => {
	for (let { obj, prop, expected } of testCases) {
		test(`Test getDotProp(${JSON.stringify(obj)}, "${prop}") -> ${expected}`, () => {
			expect(getDotProp(obj, prop)).toBe(expected);
		});
	}
});
