export interface Connector {
	sourceDefinitionId: string;
	name: string;
	dockerRepository: string;
	dockerImageTag: string;
	documentationUrl: string;
	icon: string;
	protocolVersion: string;
	custom: boolean;
	supportLevel: string;
	releaseStage: string;
	releaseDate: string;
	sourceType: string;
	maxSecondsBetweenMessages: number;
	lastPublished: string;
	cdkVersion: string;
	metrics: {
		all: {
			connector_name: string;
			connector_type: string;
			airbyte_platform: string;
			connector_version: string;
			docker_repository: string;
			connector_definition_id: string;
		};
		oss: {
			connector_name: string;
			connector_type: string;
			airbyte_platform: string;
			connector_version: string;
			docker_repository: string;
			connector_definition_id: string;
		};
	};
}
