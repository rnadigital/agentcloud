const PARENT_OBJECT_FIELD_NAME = '';

function chainValidations(
	object,
	validations: {
		field: string;
		validation: ValidationUtilOptions;
		validateIf?: ValidationCondition;
		disallowDotSplit?: boolean;
	}[],
	fieldDescriptions
) {
	validations = validations.filter(x => x);
	if (object && validations && validations.length > 0) {
		for (let v in validations) {
			const validation = validations[v];
			if (
				!validation.validateIf ||
				validation.validateIf.condition(
					getField(object, validation.validateIf.field, !validation.disallowDotSplit)
				)
			) {
				const result = validateField(
					object,
					validation.field,
					validation.validation,
					fieldDescriptions
				);
				if (result) {
					// Break validation loop
					return result;
				}
			}
		}
	} else {
		return 'Object or validations is empty';
	}
}

function getField(object: any, fieldName: string, allowSplit = false) {
	if (fieldName === PARENT_OBJECT_FIELD_NAME) {
		return object;
	} else if (allowSplit) {
		const keys = fieldName.split('.');
		let parentObject = object,
			value,
			lastIndex = keys.length - 1;

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			value = parentObject[key];
			parentObject = value;
			if (i < lastIndex && typeof value != 'object') {
				return undefined;
			}
		}
		return value;
	} else {
		return object[fieldName];
	}
}

function getFieldDescription(fieldName: string, fieldDescriptions) {
	if (!fieldDescriptions) {
		return `[${fieldName}]`;
	} else {
		const fieldDescription = fieldDescriptions[fieldName];
		if (fieldDescription) {
			return fieldDescription;
		} else {
			return `[${fieldName}]`;
		}
	}
}

function isNumber(par): boolean {
	return par !== null && par !== undefined && Number(par) !== <any>NaN;
}

function validateField(
	object: any,
	fieldName: string,
	validations: ValidationUtilOptions,
	fieldDescriptions,
	disallowDotSplit?: boolean
) {
	let error;
	if (object) {
		const field = getField(object, fieldName, !disallowDotSplit);
		const fieldDescription = getFieldDescription(fieldName, fieldDescriptions);
		let values =
			validations.asArray === true && field != undefined && Array.isArray(field) ? field : [field];
		for (let item of values) {
			if (validations.exists === true && object[fieldName] === undefined) {
				error = `${fieldDescription} does not exist`;
			}
			if (validations.ofType != null && item && typeof item !== validations.ofType) {
				error = `${fieldDescription} is an invalid type, should be "${validations.ofType}"`;
			}
			if (
				validations.notEmpty === true &&
				(item == null || item === '' || (Array.isArray(item) && item?.length === 0))
			) {
				error = `${fieldDescription} is empty`;
			}
			if (validations.lengthMin > 0 && (item == null || item.length < validations.lengthMin)) {
				error = `${fieldDescription} is too short`;
			}
			if (validations.lengthMax > 0 && (item == null || item.length > validations.lengthMax)) {
				error = `${fieldDescription} is too long`;
			}
			if (validations.hasLength >= 0 && item?.length && item.length != validations.hasLength) {
				error = `${fieldDescription} is not of the right length`;
			}
			if (
				validations.enum &&
				validations.enum.length > 0 &&
				(item == null || item.length < 0 || validations.enum.indexOf(item) < 0)
			) {
				error = `${fieldDescription} is an invalid value`;
			}
			if (
				validations.inSet &&
				validations.inSet.size > 0 &&
				(item == null ||
					(Array.isArray(item)
						? item.some(x => !validations.inSet.has(x))
						: !validations.inSet.has(item)))
			) {
				error = `${fieldDescription} is an invalid value`;
			}
			if (validations.wholeNumber && (item == null || !isNumber(item) || item % 1 !== 0)) {
				error = `${fieldDescription} is not a valid whole number`;
			}
			if (
				validations.numberToInclusive &&
				item != null &&
				(!isNumber(item) || item > validations.numberToInclusive)
			) {
				error = `${fieldDescription} is not a valid number greater than or equal to ${validations.numberToInclusive}`;
			}
			if (
				validations.numberFromInclusive &&
				item != null &&
				(!isNumber(item) || item < validations.numberFromInclusive)
			) {
				error = `${fieldDescription} is not a valid number less than or equal to ${validations.numberFromInclusive}`;
			}
			if (
				validations.regexMatch &&
				item != null &&
				validations.regexMatch instanceof RegExp &&
				!validations.regexMatch.test(item)
			) {
				error = `${fieldDescription} does not match regular expression ${validations.regexMatch.toString()}`;
			}
			if (
				validations.regexMatchAll &&
				item != null &&
				validations.regexMatchAll instanceof RegExp &&
				(!Array.isArray(item) ||
					item.length <= 0 ||
					!item.every(x => validations.regexMatchAll.test(x)))
			) {
				error = `${fieldDescription} does not match regular expression ${validations.regexMatchAll.toString()}`;
			}
			if (
				validations.startsWith &&
				validations.startsWith.length > 0 &&
				(item == null || !item.startsWith(validations.startsWith))
			) {
				error = `${fieldDescription} does not start with ${validations.startsWith}`;
			}
			if (
				validations.endsWith &&
				validations.endsWith.length > 0 &&
				(item == null || !item.endsWith(validations.endsWith))
			) {
				error = `${fieldDescription} does not end with ${validations.endsWith}`;
			}
			if (
				validations.contains &&
				validations.contains.length > 0 &&
				(item == null || !item.includes(validations.contains))
			) {
				error = `${fieldDescription} does not contain ${validations.contains}`;
			}
			if (
				validations.objectHasKeys &&
				item !== undefined &&
				(item == null ||
					typeof item !== 'object' ||
					item.constructor.name !== 'Object' ||
					Object.keys(item).length === 0)
			) {
				error = `${fieldDescription} is empty`;
			}
			if (
				validations.objectHasEitherKeys &&
				item !== undefined &&
				(item == null ||
					!Object.keys(item).some(x => validations.objectHasEitherKeys.indexOf(x) > -1))
			) {
				error = `${fieldDescription} does not have any of the following keys: ${validations.objectHasEitherKeys.join(',')}`;
			}
			if (error) {
				break;
			}
		}
	}
	return error ? validations.customError || error : null;
}

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

export { chainValidations, validateField, PARENT_OBJECT_FIELD_NAME };
