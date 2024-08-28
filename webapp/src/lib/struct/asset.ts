import { ObjectId } from 'mongodb';

//RMDVLP: asset is currently incomplete in terms of API implementation, when adding an IconAttachment, an asset is autmoatically created (this functionality is exposed) but basically any other CRUD operation associated with it isn't implemented

/**
 * @openapi
 *  components:
 *   schemas:
 *    Asset:
 *     desciption: INCOMPLETE, when adding an IconAttachment, an asset is automatically created (this functionality is exposed) but any other CRUD operation associated with it isn't implemented
 *     required:
 *      - teamId
 *      - orgId
 *      - filename
 *      - originalFilename
 *      - mimeType
 *      - uploadedAt
 *     properties:
 *      _id:
 *       type:
 *        $ref: '#/components/schemas/ObjectId'
 *      teamId:
 *       description: Associated teamId (this links to a corresponding Team object)
 *       type:
 *        $ref: '#/components/schemas/ObjectId'
 *      orgId:
 *       description: Associated orgId (this links to a corresponding Org object)
 *       type:
 *        $ref: '#/components/schemas/ObjectId'
 *      filename:
 *       description: the filename of the asset, this is generally a string representation of the _id followed by the filtype. i.e. "abcdef123456789.png"
 *       type: string
 *      originalFilename:
 *       description: the original filename of the asset at point of upload
 *       type: string
 *      mimeType:
 *       description: The media type of the asset, indicating the format of the file. Common MIME types include 'image/jpeg' for JPEG
 *       type: string
 *      uploadedAt:
 *       description: The date and time at which the asset was uploaded.
 *       type: string
 *       format: date-time
 */
export type Asset = {
	_id?: ObjectId;
	teamId: ObjectId;
	orgId: ObjectId;
	filename: string;
	originalFilename: string;
	mimeType: string;
	uploadedAt: Date;
};

export type IconAttachment = {
	id: ObjectId;
	filename: string;
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
