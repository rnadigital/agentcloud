import { describe, expect, test } from '@jest/globals';
import { chainValidations, PARENT_OBJECT_FIELD_NAME } from './validationUtils';

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
	age: 25
};

const fieldDescriptions = { email: 'Email', password: 'Password', age: 'Age' };

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
		expect(validationError).toBe(undefined);
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
		expect(validationError).toBe(undefined);
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
});
