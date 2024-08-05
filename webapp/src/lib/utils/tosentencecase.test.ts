import { describe, expect, test } from '@jest/globals';

import { toSentenceCase } from './tosentencecase';

const testCases = [
	{ in: 'hello_world', out: 'Hello World' },
	{ in: 'this_is_a_test', out: 'This Is A Test' },
	{ in: 'convert_to_sentence_case', out: 'Convert To Sentence Case' },
	{ in: 'singleword', out: 'Singleword' },
	{ in: '', out: '' }
];

describe('Test toSentenceCase() util', () => {
	for (let t of testCases) {
		test(`Test toSentenceCase(${t.in}) -> ${t.out}`, () => {
			expect(toSentenceCase(t.in)).toBe(t.out);
		});
	}
});
