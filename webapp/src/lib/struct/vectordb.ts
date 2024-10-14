import mongoose, { Document, Schema, Types } from 'mongoose';

const { ObjectId } = Types;

interface VectorDb extends Document {
	orgId: Schema.Types.ObjectId;
	teamId: Schema.Types.ObjectId;
	apiKey: string;
	url: string;
}

const vectorDbschema = new Schema<VectorDb>(
	{
		orgId: ObjectId,
		teamId: ObjectId,
		apiKey: { type: String, required: true },
		url: String
	},
	{ timestamps: true }
);

const modelName = 'VectorDb';
export const VectorDbModel = mongoose.models?.VectorDb || mongoose.model(modelName, vectorDbschema);
