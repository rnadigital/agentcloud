export enum CollectionStatus {
	Success = 'Success',
	Failure = 'Failure',
	DoesNotExist = 'DoesNotExist',
	NotFound = 'NotFound',
}

export interface VectorResponseBody {
	status: CollectionStatus;
	data?: any; // Replace 'any' with the appropriate type if known
	error_message?: any; // Same here, replace 'any' with the appropriate type if known
}

export enum Cloud {
	GCP = 'gcp',
	AWS = 'aws',
	AZURE = 'azure',
}

export enum Distance { // Note: always cosine (for now)
	UnknownDistance = 0,
	Cosine = 1,
	Euclid = 2,
	Dot = 3,
	Manhattan = 4,
}

export enum Region {
	US = 'US',
	EU = 'EU',
	AU = 'AU',
}

export interface CollectionCreateBody {
	collection_name: string;
	dimensions: number;
	distance: Distance; // cosine always for now
	vector_name?: string; // vector_name is just a Model.config.model e.g. "text-embedding-3-small"
	region?: Region; // Made region optional here
}
