'use strict';

import { ObjectId } from 'mongodb';

export type ToolRevision = {
	_id?: ObjectId;
	orgId?: ObjectId;
	teamId?: ObjectId;
	toolId: ObjectId;
	content: any;
	date: Date;
};

/**
 * @openapi
 *  components:
 *   schemas:
 *    ToolRevision:
 *     type: object
 *     description: Represents a revision of a tool, including the content of the revision and metadata such as the organization, team, and tool identifiers.
 *     required:
 *      - toolId
 *      - content
 *      - date
 *     properties:
 *      _id:
 *       description: Unique identifier for the tool revision.
 *       $ref: '#/components/schemas/ObjectId'
 *      orgId:
 *       description: Identifier of the organization to which the tool revision belongs.
 *       $ref: '#/components/schemas/ObjectId'
 *      teamId:
 *       description: Identifier of the team to which the tool revision belongs.
 *       $ref: '#/components/schemas/ObjectId'
 *      toolId:
 *       description: Identifier of the tool associated with this revision.
 *       $ref: '#/components/schemas/ObjectId'
 *      content:
 *       description: The content of the tool revision.
 *       type: object
 *       additionalProperties: true
 *      date:
 *       description: The date and time when the revision was created.
 *       type: string
 *       format: date-time
 */
