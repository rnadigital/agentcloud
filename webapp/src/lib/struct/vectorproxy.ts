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
	US = 'US',
	EU = 'EU',
	AU = 'AU'
}

export interface CollectionCreateBody {
	collection_name: string;
	dimensions: number;
	distance: Distance; // cosine always for now
	vector_name?: string; // vector_name is just a Model.config.model e.g. "text-embedding-3-small"
	region?: Region; // Made region optional here
}
