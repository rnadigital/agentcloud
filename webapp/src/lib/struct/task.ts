'use strict';

import { ObjectId } from 'mongodb';
import { IconAttachment } from 'struct/asset';

export interface FormFieldConfig {
	position: string;
	type: 'string' | 'number' | 'radio' | 'checkbox' | 'select' | 'multiselect' | 'date';
	name: string;
	label: string;
	description?: string;
	required?: boolean;
	options?: string[];
	tooltip?: string;
}

export interface Task {
	_id?: ObjectId | string;
	orgId?: ObjectId | string;
	teamId?: ObjectId | string;
	name: string;
	description: string;
	agentId?: ObjectId | string;
	expectedOutput?: string;
	toolIds?: (ObjectId | string)[];
	asyncExecution?: boolean;
	context?: (ObjectId | string)[];
	outputJson?: any;
	outputPydantic?: any;
	outputFile?: string;
	icon?:
		| IconAttachment
		| {
				id: string;
				filename: string;
		  }
		| null;
	requiresHumanInput?: boolean;
	hidden?: boolean;
	formFields?: FormFieldConfig[];
}
