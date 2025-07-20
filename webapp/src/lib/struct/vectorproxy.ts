export enum CollectionStatus {
	Success = 'Success',
	Failure = 'Failure',
	DoesNotExist = 'DoesNotExist',
	NotFound = 'NotFound'
}

export interface VectorResponseBody {
	status: CollectionStatus;
	data?: any; // Replace 'any' with the appropriate type if known
	error_message?: any; // Same here, replace 'any' with the appropriate type if known
}

export enum Cloud {
	GCP = 'gcp',
	AWS = 'aws',
	AZURE = 'azure'
}

export enum Distance { // Note: always cosine (for now)
	UnknownDistance = 'UnknownDistance',
	Cosine = 'Cosine',
	Euclid = 'Euclid',
	Dot = 'Dot',
	Manhattan = 'Manhattan'
}

export enum Region {
	US_EAST_1 = 'us-east-1', // Virginia
	US_WEST_2 = 'us-west-2', // Oregon
	EU_WEST_1 = 'eu-west-1', // Ireland
	US_CENTRAL_1 = 'us-central1', // Iowa
	EU_WEST_4 = 'europe-west4', // Netherlands
	EASTUS2 = 'eastus2' // Virginia
}

export const CloudRegionMap: Record<Cloud, Region[]> = {
	[Cloud.AWS]: [Region.US_EAST_1, Region.US_WEST_2, Region.EU_WEST_1],
	[Cloud.GCP]: [Region.US_CENTRAL_1, Region.EU_WEST_4],
	[Cloud.AZURE]: [Region.EASTUS2]
};

export interface CollectionCreateBody {
	collection_name?: string;
	dimensions?: number;
	distance?: Distance; // cosine always for now
	vector_name?: string; // vector_name is just a Model.config.model e.g. "text-embedding-3-small"
	region?: Region; // Made region optional here
	cloud?: Cloud;
	index_name?: string;
}
