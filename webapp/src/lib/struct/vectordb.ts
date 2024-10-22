import mongoose, { Document, InferSchemaType, Model, Schema, Types } from 'mongoose';

const { ObjectId } = Types;

export interface VectorDb {
	orgId: Types.ObjectId;
	teamId: Types.ObjectId;
	type: string;
	apiKey: string;
	url?: string;
}

const vectorDbschema = new Schema<VectorDb>(
	{
		orgId: ObjectId,
		teamId: ObjectId,
		type: { type: String, required: true },
		apiKey: { type: String, required: true },
		url: String
	},
	{ timestamps: true }
);

export type VectorDbType = InferSchemaType<typeof vectorDbschema>;

const modelName = 'VectorDb';
// export const VectorDbModel = mongoose.models?.VectorDb || mongoose.model(modelName, vectorDbschema);
export const VectorDbModel = mongoose.model<VectorDb>(modelName, vectorDbschema);

export type VectorDbDocument = InferSchemaType<typeof vectorDbschema>;
