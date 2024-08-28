import { ObjectId } from 'mongodb';

export type Asset = {
	_id?: ObjectId;
	teamId: ObjectId;
	orgId: ObjectId;
	filename: string;
	originalFilename: string;
	mimeType: string;
	uploadedAt: Date;
};

/**
 * @openapi
 *  components:
 *   schemas:
 *    IconAttachment:
 *     summary: Attachment, generally used for image upload
 *     required:
 *      - id
 *      - filename
 *     properties:
 *      id:
 *       description: this is NOT a unique id for the IconAttachment, this is a Mongo id that links to an Asset object (neet to implement assets in docs)
 *       type:
 *        $ref: '#/components/schemas/ObjectId'
 *      filename:
 *       type: string
 *       description: Filename of the attachment at the point of upload
 */
export type IconAttachment = {
	id: ObjectId;
	filename: string;
};
