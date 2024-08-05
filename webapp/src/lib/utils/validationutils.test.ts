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
});
