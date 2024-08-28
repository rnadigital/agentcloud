'use strict';

import { ObjectId } from 'mongodb';
import { IconAttachment } from 'struct/asset';

export type CodeExecutionConfigType = {
	lastNMessages: number;
	workDirectory: string;
};
/**
 * GET /[resourceSlug]/agents
 * team page html
 */
export type Agent = {
	_id?: ObjectId | string;
	orgId?: ObjectId | string;
	teamId?: ObjectId | string;
	name: string;
	role: string;
	goal: string;
	backstory: string;
	modelId: ObjectId | string;
	functionModelId: ObjectId | string | null;
	maxIter: number | null; // unused, not documented in API
	maxRPM: number | null; // unused, not documented in API
	verbose: boolean;
	allowDelegation: boolean;
	toolIds?: (ObjectId | string)[];
	icon?:
		| IconAttachment
		| {
				id: string;
				filename: string;
		  };
	hidden?: boolean;
	group?: any[];
};

/**
 * @openapi
 *  components:
 *   schemas:
 *    ObjectId:
 *     summary: Mongodb Object id, unique identifier, length of 24 characters fitting the following regex; [a-f0-9]{24}
 *     required:
 *      - _id
 *     properties:
 *      _id: string
 */
/**
 * @openapi
 * components:
 *  schemas:
 *   Agent:
 *    summary: An agent object used for tasks or apps
 *
 *    tags:
 *     - agent
 *     - agents
 *
 *    descriminator:
 *     propertyName: _id
 *
 *    required:
 *     - _id
 *     - name
 *     - role
 *     - goal
 *     - backstory
 *     - modelId
 *     - verbose
 *     - allowDelegation
 *
 *    properties:
 *     _id:
 *      type:
 *       oneOf:
 *        $ref: '#/components/schemas/ObjectId'
 *        type: string
 *      description: Unique Mongodb identifier for the object
 *     orgId:
 *      description: Organisation the agent is linked to (generally the org of the user that created the agent)
 *      type:
 *       oneOf:
 *        $ref: '#/components/schemas/ObjectId'
 *        type: string
 *     teamId:
 *      description: Team the agent is linked to (generally the team of the user that created the agent)
 *      type:
 *       oneOf:
 *        $ref: '#/components/schemas/ObjectId'
 *        type: string
 *     name:
 *      type: string
 *      description: Name of the agent
 *     role:
 *      description: Fed into the LLM to help it provide a more detailed and correct response
 *      type: string
 *     goal:
 *      description: The goal of the agent is fed into the LLM, this allows the LLM to know it's role in the RAG pipeline
 *      type: string
 *     backstory:
 *      description: A detailed description of what the LLM will be doing
 *      type: string
 *     modelId:
 *      description: The linked ObjectId of the model being used by this agent (this links to a Model object)
 *      type:
 *       oneOf:
 *        $ref: '#/components/schemas/ObjectId'
 *        type: string
 *     functionModelId:
 *      description: A secondary model used to execute function calls (this links to a Model object), set to null if unused automatically by the API
 *      type:
 *       oneOf:
 *        $ref: '#/components/schemas/ObjectId'
 *        type: string
 *     verbose:
 *      description: True or false check to determine if custom verbosity is used in agent, higher verbosity requires agent to include more of the retrieved documents at the expense of longer answers, lower verbosity can result in shorter answers but can also ommit crucial details
 *      type: boolean
 *     allowDelegation:
 *      description: True or false check to determine if the agent is allowed to delegate tasks to other agents in the context of an app
 *      type: boolean
 *     toolIds:
 *      description: Array of the tools the agent can access to improve performance and abstract tool functionality from agent usage
 *      type: array
 *      items:
 *       type:
 *         oneOf:
 *          $ref: '#/components/schemas/ObjectId'
 *          type: string
 *     icon:
 *      description: IconAttachment object used to hold the attached icon used for the agent (this links to an IconAttachment object);
 *      type:
 *       $ref: '#/components/schemas/IconAttachment'
 *
 */

// export type Agent = {
// 	_id?: ObjectId;
// 	orgId?: ObjectId;
// 	teamId?: ObjectId;
// 	name: string;
// 	role: string;
// 	goal: string;
// 	backstory: string;
// 	modelId: ObjectId;
// 	functionModelId: ObjectId;
// 	maxIter: number;
// 	maxRPM: number;
// 	verbose: boolean;
// 	allowDelegation: boolean;
// 	toolIds?: ObjectId[];
// 	icon?: IconAttachment;
// 	// stepCallback: Function;
// 	hidden?: boolean;
// };

// export interface Agent1 {
// 	_id: string;
// 	orgId: string;
// 	teamId: string;
// 	name: string;
// 	role: string;
// 	goal: string;
// 	backstory: string;
// 	modelId: string;
// 	functionModelId: string | null;
// 	maxIter: number | null;
// 	maxRPM: number | null;
// 	verbose: boolean;
// 	allowDelegation: boolean;
// 	toolIds: string[];
// 	icon: {
// 		id: string;
// 		filename: string;
// 	};
// 	group: any[];
// }
