import { describe, expect, test } from '@jest/globals';

import formatSize from './formatsize';

const testCases = [
	{ in: 0, out: '0B' },
	{ in: 500, out: '500B' },
	{ in: 1024, out: '1KB' },
	{ in: 1048576, out: '1MB' },
	{ in: 1073741824, out: '1GB' },
	{ in: 1099511627776, out: '1TB' },
	{ in: 123456789, out: '117.7MB' },
	{ in: 9876543210, out: '9.2GB' }
];

describe('Test formatSize() util', () => {
	for (let t of testCases) {
		test(`Test formatSize(${t.in}) -> ${t.out}`, () => {
			expect(formatSize(t.in)).toBe(t.out);
		});
	}
});
