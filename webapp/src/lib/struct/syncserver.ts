import { ObjectId } from 'mongodb';

// don't touch these or use them outside the sync-server unless you know what you're doing (you don't)

interface Connection {
	connectionId: string;
	name: string;
	sourceId: string;
	destinationId: string;
	workspaceId: string;
	status: string;
	schedule: Record<string, any>; // Replace with a more specific type if available
	dataResidency: string;
	configurations: Record<string, any>; // Replace with a more specific type if available
	nonBreakingSchemaUpdatesBehavior: string;
	namespaceDefinition: string;
	prefix: string;
}

interface Datasource {
	_id: ObjectId;
	orgId: ObjectId;
	teamId: ObjectId;
	name: string;
	description: string;
	filename: string | null;
	originalName: string;
	sourceId: string;
	connectionId: string;
	destinationId: string;
	sourceType: string;
	workspaceId: string;
	lastSyncedDate: string | null;
	discoveredSchema: Record<string, any>; // Replace with a more specific type if available
	createdDate: string;
	status: string;
	recordCount: Record<string, any>; // Replace with a more specific type if available
	timeUnit: string;
	connectionSettings: Record<string, any>; // Replace with a more specific type if available
	embeddingField: string;
	modelId: ObjectId;
	streamConfig: Record<string, any>; // Replace with a more specific type if available
}

interface StripeInfo {
	stripeCustomerId: string;
	stripePlan: string;
	stripeAddons: Record<string, any>; // Replace with a more specific type if available
	stripeTrial: boolean;
	stripeEndsAt: number;
}

export interface AugmentedJob {
	jobId: number;
	status: string;
	jobType: string;
	startTime: string;
	connectionId: string;
	lastUpdatedAt: string;
	duration: string;
	bytesSynced: number;
	rowsSynced: number;
	connection: Connection;
	datasource: Datasource;
	stripe: StripeInfo;
}
