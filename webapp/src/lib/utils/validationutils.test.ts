import { describe, expect, test } from '@jest/globals';
import { chainValidations, PARENT_OBJECT_FIELD_NAME } from './validationutils';

type ValidationUtilOptions = {
	ofType?: string;
	exists?: boolean;
	notEmpty?: boolean;
	lengthMin?: number;
	lengthMax?: number;
	hasLength?: number;
	inSet?: Set<string>;
	enum?: string[];
	wholeNumber?: boolean;
	numberFromInclusive?: number;
	numberToInclusive?: number;
	objectHasKeys?: boolean;
	objectHasEitherKeys?: string[];
	regexMatch?: RegExp;
	regexMatchAll?: RegExp;
	startsWith?: string;
	endsWith?: string;
	contains?: string;
	customError?: string;
	asArray?: boolean;
};

type ValidationCondition = {
	field: string;
	condition: (fieldValue: any) => boolean;
};

const sampleObject = {
	email: 'test@example.com',
	password: 'password123',
	age: 25,
	role: 'admin',
	numbers: [1, 2, 3],
	address: {
		city: 'New York',
		zip: '10001'
	}
};

const fieldDescriptions = { email: 'Email', password: 'Password', age: 'Age', role: 'Role', numbers: 'Numbers', 'address.city': 'City', 'address.zip': 'ZIP Code' };

describe('Test chainValidations() util', () => {
	test('Validates email and password fields correctly', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'email',
					validation: { notEmpty: true, regexMatch: /^\S+@\S+\.\S+$/, ofType: 'string' }
				},
				{ field: 'password', validation: { notEmpty: true, lengthMin: 8, ofType: 'string' } }
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Fails when email is empty', () => {
		const validationError = chainValidations(
			{ ...sampleObject, email: '' },
			[
				{
					field: 'email',
					validation: { notEmpty: true, regexMatch: /^\S+@\S+\.\S+$/, ofType: 'string' }
				},
				{ field: 'password', validation: { notEmpty: true, lengthMin: 8, ofType: 'string' } }
			],
			fieldDescriptions
		);
		expect(validationError).toBe('Email does not match regular expression /^\\S+@\\S+\\.\\S+$/');
	});

	test('Fails when email is invalid', () => {
		const validationError = chainValidations(
			{ ...sampleObject, email: 'invalid-email' },
			[
				{
					field: 'email',
					validation: { notEmpty: true, regexMatch: /^\S+@\S+\.\S+$/, ofType: 'string' }
				},
				{ field: 'password', validation: { notEmpty: true, lengthMin: 8, ofType: 'string' } }
			],
			fieldDescriptions
		);
		expect(validationError).toBe('Email does not match regular expression /^\\S+@\\S+\\.\\S+$/');
	});

	test('Fails when password is too short', () => {
		const validationError = chainValidations(
			{ ...sampleObject, password: 'short' },
			[
				{
					field: 'email',
					validation: { notEmpty: true, regexMatch: /^\S+@\S+\.\S+$/, ofType: 'string' }
				},
				{ field: 'password', validation: { notEmpty: true, lengthMin: 8, ofType: 'string' } }
			],
			fieldDescriptions
		);
		expect(validationError).toBe('Password is too short');
	});

	test('Validates age field correctly', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'age',
					validation: { wholeNumber: true, numberFromInclusive: 0, ofType: 'number' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Fails when age is not a whole number', () => {
		const validationError = chainValidations(
			{ ...sampleObject, age: 25.5 },
			[
				{
					field: 'age',
					validation: { wholeNumber: true, numberFromInclusive: 0, ofType: 'number' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('Age is not a valid whole number');
	});

	test('Passes when enum met', () => {
		const validationError = chainValidations(
			{ foo: 'foo' },
			[
				{
					field: 'foo',
					validation: { enum: ['foo', 'bar'] }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Fails when enum not met', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'baz',
					validation: { enum: ['foo', 'bar'] }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('[baz] is an invalid value');
	});

	test('Fails when role is not in the set', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'role',
					validation: { inSet: new Set(['user', 'guest']) }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('Role is an invalid value');
	});

	test('Testing array inSet() passing', () => {
		const validationError = chainValidations(
			{ test: ['a', 'b'] },
			[
				{
					field: 'test',
					validation: { inSet: new Set(['a', 'b']) }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Testing array inSet() failing', () => {
		const validationError = chainValidations(
			{ test: ['a', 'b', 'c'] },
			[
				{
					field: 'test',
					validation: { inSet: new Set(['a', 'b']) }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('[test] is an invalid value');
	});

	test('Validates nested object fields correctly', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'address.city',
					validation: { notEmpty: true, ofType: 'string' }
				},
				{
					field: 'address.zip',
					validation: { notEmpty: true, ofType: 'string', regexMatch: /^\d{5}$/ }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Fails when nested object field is invalid', () => {
		const validationError = chainValidations(
			{ ...sampleObject, address: { ...sampleObject.address, zip: 'abc' } },
			[
				{
					field: 'address.zip',
					validation: { notEmpty: true, ofType: 'string', regexMatch: /^\d{5}$/ }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('ZIP Code does not match regular expression /^\\d{5}$/');
	});

	test('Fails when field is too long', () => {
		const validationError = chainValidations(
			{ ...sampleObject, email: 'a'.repeat(256) },
			[
				{
					field: 'email',
					validation: { notEmpty: true, lengthMax: 255 }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('Email is too long');
	});

	test('Validates array fields correctly', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'numbers',
					validation: { asArray: true, notEmpty: true, ofType: 'number' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Fails when array field has invalid type', () => {
		const validationError = chainValidations(
			{ ...sampleObject, numbers: [1, 'two', 3] },
			[
				{
					field: 'numbers',
					validation: { asArray: true, notEmpty: true, ofType: 'number' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('Numbers is an invalid type, should be "number"');
	});

	test('Fails when object is empty', () => {
		const validationError = chainValidations(
			{},
			[
				{
					field: 'email',
					validation: { notEmpty: true, regexMatch: /^\S+@\S+\.\S+$/, ofType: 'string' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('Email is empty');
	});

	test('Fails when field does not exist', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'nonExistentField',
					validation: { exists: true }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('[nonExistentField] does not exist');
	});

	test('Fails when field does not exist', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'nonExistentField',
					validation: { exists: true, customError: 'foobar' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('foobar');
	});

	test('Passes when object has keys', () => {
		const validationError = chainValidations(
			{ a: { x: 1, y: '2' } },
			[
				{
					field: 'a',
					validation: { objectHasKeys: true, customError: 'object doesnt have keys' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Passes when object has keys', () => {
		const validationError = chainValidations(
			{ a: 'z' },
			[
				{
					field: 'a',
					validation: { objectHasKeys: true, customError: 'object doesnt have keys' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('object doesnt have keys');
	});

	test('Passes when object has any key in list', () => {
		const validationError = chainValidations(
			{ a: { x: 1, y: '2' } },
			[
				{
					field: 'a',
					validation: { exists: true, objectHasEitherKeys: ['x', 'y'], customError: 'key not found' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Fails when object doesnt have any keys in list', () => {
		const validationError = chainValidations(
			{ a: { x: 1, y: '2' } },
			[
				{
					field: 'a',
					validation: { exists: true, objectHasEitherKeys: ['n', 'o'], customError: 'key not found' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('key not found');
	});

	test('Passes when field contains value', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'email',
					validation: { contains: '@' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Fails when field doesnt contain value', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'email',
					validation: { contains: 'THIS STRING IS NOT IN THE EMAIL FIELD', customError: 'email does not contain value' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('email does not contain value');
	});

	test('Passes when field starts with x', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'email',
					validation: { startsWith: 'test' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Fails when field does not start with x', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'email',
					validation: { startsWith: 'abc123' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('Email does not start with abc123');
	});

	test('Passes when field ends with x', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'email',
					validation: { endsWith: '.com' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Fails when field doesnt end with x', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'email',
					validation: { endsWith: 'abc123' }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('Email does not end with abc123');
	});

	test('Test validateIf that is true', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'email',
					validation: { endsWith: '.com' },
					validateIf: { field: 'email', condition: () => { return true } }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Test validateIf that is false', () => {
		const validationError = chainValidations(
			sampleObject,
			[
				{
					field: 'email',
					validation: { endsWith: '.com' },
					validateIf: { field: 'email', condition: () => { return false } }
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Test regexMatchAll passing', () => {
		const validationError = chainValidations(
			{ x: ['a', 'b', 'c'] },
			[
				{
					field: 'x',
					validation: { regexMatchAll: /[a-z]/ },
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Test regexMatchAll failing', () => {
		const validationError = chainValidations(
			{ x: ['a', '12345', 'c'] },
			[
				{
					field: 'x',
					validation: { regexMatchAll: /[a-z]/ },
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('[x] does not match regular expression /[a-z]/');
	});

	test('Test numberFromInclusive passing', () => {
		const validationError = chainValidations(
			{ x: 5 },
			[
				{
					field: 'x',
					validation: { numberFromInclusive: 3 },
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Test numberFromInclusive failing', () => {
		const validationError = chainValidations(
			{ x: 2 },
			[
				{
					field: 'x',
					validation: { numberFromInclusive: 3 },
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('[x] is not a valid number less than or equal to 3');
	});

	test('Test numberToInclusive passing', () => {
		const validationError = chainValidations(
			{ x: 5 },
			[
				{
					field: 'x',
					validation: { numberToInclusive: 6 },
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBeUndefined();
	});

	test('Test numberToInclusive failing', () => {
		const validationError = chainValidations(
			{ x: 5 },
			[
				{
					field: 'x',
					validation: { numberToInclusive: 4 },
				}
			],
			fieldDescriptions
		);
		expect(validationError).toBe('[x] is not a valid number greater than or equal to 4');
	});

	test('Test numberToInclusive failing (no fieldDescriptions)', () => {
		const validationError = chainValidations(
			{ x: 5 },
			[
				{
					field: 'x',
					validation: { numberToInclusive: 4 },
				}
			],
			null
		);
		expect(validationError).toBe('[x] is not a valid number greater than or equal to 4');
	});

	test('Test hasLength passing', () => {
		const validationError = chainValidations(
			{ x: 'test' },
			[
				{
					field: 'x',
					validation: { hasLength: 4 },
				}
			],
			null
		);
		expect(validationError).toBeUndefined();
	});

	test('Test hasLength failing', () => {
		const validationError = chainValidations(
			{ x: 't e s t' },
			[
				{
					field: 'x',
					validation: { hasLength: 4 },
				}
			],
			null
		);
		expect(validationError).toBe('[x] is not of the right length');
	});

});
