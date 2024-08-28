import { ObjectId } from 'mongodb';

export enum ShareLinkTypes {
	APP = 'app'
}

export type ShareLinkType = ShareLinkTypes;

export type ShareLink = {
	_id?: ObjectId;
	orgId: ObjectId;
	teamId: ObjectId;
	shareId: string; // actual id that goes in the link
	type: ShareLinkType;
	createdDate: Date;
	payload: {
		id: ObjectId; // i.e the app _id since we only suppor apps for now
	};
};

/**
 * @openapi
 *  components:
 *   schemas:
 *    ShareLinkTypes:
 *     type: string
 *     description: Enum representing the types of share links.
 *     enum:
 *      - app
 *
 *    ShareLinkType:
 *     type: string
 *     description: Represents the type of the share link, currently only supporting 'app'.
 *     enum:
 *      - app
 *
 *    ShareLink:
 *     type: object
 *     description: Represents a shareable link within the system, including details about the linked object and the type of share link.
 *     required:
 *      - orgId
 *      - teamId
 *      - shareId
 *      - type
 *      - createdDate
 *      - payload
 *     properties:
 *      _id:
 *       description: Unique identifier for the share link.
 *       $ref: '#/components/schemas/ObjectId'
 *      orgId:
 *       description: Identifier of the organization to which the share link belongs.
 *       $ref: '#/components/schemas/ObjectId'
 *      teamId:
 *       description: Identifier of the team to which the share link belongs.
 *       $ref: '#/components/schemas/ObjectId'
 *      shareId:
 *       description: The actual ID that goes into the shareable link.
 *       type: string
 *      type:
 *       description: The type of the share link.
 *       $ref: '#/components/schemas/ShareLinkType'
 *      createdDate:
 *       description: The date and time when the share link was created.
 *       type: string
 *       format: date-time
 *      payload:
 *       type: object
 *       description: The payload of the share link, containing specific details related to the shared item.
 *       required:
 *        - id
 *       properties:
 *        id:
 *         description: The identifier of the linked object, such as the app's _id.
 *         $ref: '#/components/schemas/ObjectId'
 */
