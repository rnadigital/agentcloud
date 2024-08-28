'use strict';

import { ObjectId } from 'mongodb';


export enum ProcessImpl {
	SEQUENTIAL = 'sequential',
	HIERARCHICAL = 'hierarchical'
}

export type Crew = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	name: string;
	tasks: ObjectId[];
	agents: ObjectId[];
	process: ProcessImpl;
	managerModelId?: ObjectId;
	hidden?: boolean;
	verbose?: number;
	fullOutput?: boolean;
};

/**
 * @openapi
 *  components:
 *   schemas:
 *    Crew:
 *     type: object
 *     description: Represents a crew responsible for handling tasks within an organisation. 
 *     required:
 *      - name
 *      - tasks
 *      - agents
 *      - process
 *     properties:
 *      _id:
 *       description: Unique Mongo identifier for the crew.
 *       $ref: '#/components/schemas/ObjectId'
 *      orgId:
 *       description: Identifier of the organisation to which the crew belongs (generally the same organisation of the user who created the Crew).
 *       $ref: '#/components/schemas/ObjectId'
 *      teamId:
 *       description: Identifier of the team to which the crew belongs.
 *       $ref: '#/components/schemas/ObjectId'
 *      name:
 *       description: The name of the crew.
 *       type: string
 *      tasks:
 *       description: List of task identifiers assigned to the crew.
 *       type: array
 *       items:
 *        $ref: '#/components/schemas/ObjectId'
 *      agents:
 *       description: List of agent identifiers associated with the crew.
 *       type: array
 *       items:
 *        $ref: '#/components/schemas/ObjectId'
 *      managerModelId:
 *       description: Identifier of the manager model for the crew, if applicable.
 *       $ref: '#/components/schemas/ObjectId'
 *      hidden:
 *       description: Indicates whether the crew is hidden from standard views.
 *       type: boolean
 *      verbose:
 *       description: The verbosity level for crew-related outputs.
 *       type: integer
 *       format: int32
 *      fullOutput:
 *       description: Indicates whether to provide full output for crew operations.
 *       type: boolean
 */

