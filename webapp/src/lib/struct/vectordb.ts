import mongoose, { Document, InferSchemaType, Model, Schema, Types } from 'mongoose';

const { ObjectId } = Types;

export interface VectorDb {
	orgId: Types.ObjectId;
	teamId: Types.ObjectId;
	type: string;
	apiKey: string;
	url?: string;
	name: string;
}

const vectorDbschema = new Schema<VectorDb>(
	{
		orgId: ObjectId,
		teamId: ObjectId,
		type: { type: String, required: true },
		apiKey: { type: String, required: true },
		url: String,
		name: String
	},
	{ timestamps: true }
);

export type VectorDbType = InferSchemaType<typeof vectorDbschema>;

const modelName = 'VectorDb';
const existingModel = mongoose.models[modelName] as mongoose.Model<VectorDb> | undefined;
export const VectorDbModel: mongoose.Model<VectorDb> =
	existingModel || mongoose.model<VectorDb>(modelName, vectorDbschema);

export type VectorDbDocument = InferSchemaType<typeof vectorDbschema> & {
	_id: string;
	createdAt: string;
};
