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
	displayOnlyFinalOutput?: boolean;
	hidden?: boolean;
	formFields?: FormFieldConfig[];
	isStructuredOutput?: boolean;
}

/**
 * @openapi
 *  components:
 *   schemas:
 *    FormFieldConfig:
 *     type: object
 *     description: Configuration for a form field within a task, including position, type, and optional settings.
 *     required:
 *      - position
 *      - type
 *      - name
 *      - label
 *     properties:
 *      position:
 *       description: The position of the form field within the form layout.
 *       type: string
 *      type:
 *       description: The data type of the form field.
 *       type: string
 *       enum:
 *        - string
 *        - number
 *        - radio
 *        - checkbox
 *        - select
 *        - multiselect
 *        - date
 *      name:
 *       description: The name attribute of the form field.
 *       type: string
 *      label:
 *       description: The label displayed for the form field.
 *       type: string
 *      description:
 *       description: An optional description for the form field.
 *       type: string
 *      required:
 *       description: Indicates if the form field is required.
 *       type: boolean
 *      options:
 *       description: Options available for fields like radio, select, or multiselect.
 *       type: array
 *       items:
 *        type: string
 *      tooltip:
 *       description: A tooltip providing additional information about the form field.
 *       type: string
 *
 *    Task:
 *     type: object
 *     description: Represents a task within the system, including its configuration, expected output, and optional form fields.
 *     required:
 *      - name
 *      - description
 *     properties:
 *      _id:
 *       description: Unique identifier for the task.
 *       oneOf:
 *        - $ref: '#/components/schemas/ObjectId'
 *        - type: string
 *      orgId:
 *       description: Identifier of the organization to which the task belongs.
 *       oneOf:
 *        - $ref: '#/components/schemas/ObjectId'
 *        - type: string
 *      teamId:
 *       description: Identifier of the team to which the task belongs.
 *       oneOf:
 *        - $ref: '#/components/schemas/ObjectId'
 *        - type: string
 *      name:
 *       description: The name of the task.
 *       type: string
 *      description:
 *       description: A detailed description of the task.
 *       type: string
 *      agentId:
 *       description: Identifier of the agent associated with the task.
 *       oneOf:
 *        - $ref: '#/components/schemas/ObjectId'
 *        - type: string
 *      expectedOutput:
 *       description: The expected output of the task.
 *       type: string
 *      toolIds:
 *       description: List of tool identifiers associated with the task.
 *       type: array
 *       items:
 *        oneOf:
 *         - $ref: '#/components/schemas/ObjectId'
 *         - type: string
 *      asyncExecution:
 *       description: Indicates if the task is executed asynchronously.
 *       type: boolean
 *      context:
 *       description: Contextual information related to the task.
 *       type: array
 *       items:
 *        oneOf:
 *         - $ref: '#/components/schemas/ObjectId'
 *         - type: string
 *      outputJson:
 *       description: The JSON output of the task.
 *       type: object
 *       additionalProperties: true
 *      outputPydantic:
 *       description: The Pydantic output of the task.
 *       type: object
 *       additionalProperties: true
 *      outputFile:
 *       description: The file output of the task.
 *       type: string
 *      icon:
 *       description: Icon associated with the task, either an attachment or an object containing the icon details.
 *       oneOf:
 *        - $ref: '#/components/schemas/IconAttachment'
 *        - type: object
 *          properties:
 *           id:
 *            description: Identifier for the icon.
 *            type: string
 *           filename:
 *            description: Filename of the icon.
 *            type: string
 *        - type: null
 *      requiresHumanInput:
 *       description: Indicates if the task requires human input.
 *       type: boolean
 *      displayOnlyFinalOutput:
 *       description: Indicates if only the final output should be displayed.
 *       type: boolean
 *      hidden:
 *       description: Indicates if the task is hidden from standard views.
 *       type: boolean
 *      formFields:
 *       description: Array of form field configurations associated with the task.
 *       type: array
 *       items:
 *        $ref: '#/components/schemas/FormFieldConfig'
 *      isStructuredOutput:
 *       description: Indicates if the output of the task is structured.
 *       type: boolean
 */
