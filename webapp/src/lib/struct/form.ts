export interface Connector {
	name_oss: string;
	spec_oss: {
		documentationUrl: string;
		connectionSpecification: Schema;
	};
}

export interface Schema {
	$schema: string;
	title: string;
	type: string;
	description?: string;
	required: string[];
	additionalProperties: boolean;
	properties: {
		[key: string]: Property;
	};
}

export interface FormFieldProps {
	name: string;
	testId?: string;
	type: string;
	autofocus?: boolean;
	disabled?: boolean;
	property: Property;
	isRequired?: boolean;
	level?: number;
}

export interface Property {
	const?: string;
	type: 'string' | 'object' | 'integer' | 'boolean' | 'array';
	enum?: string[];
	description?: string;
	order?: number;
	items: {
		enum?: string[];
		type: 'array' | 'object' | 'string';
		properties: {
			[key: string]: Property;
		};
		required?: string[];
	};
	minItems?: number;
	title?: string;
	uniqueItems: boolean;
	format?: string;
	oneOf?: Property[];
	properties?: {
		[key: string]: Property;
	};
	required?: string[];
}
