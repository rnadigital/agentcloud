'use strict';

import debug from 'debug';
import dotenv from 'dotenv';
const log = debug('webapp:vectordb:proxy');
dotenv.config({ path: '.env' });

// Import structs from the alias
import { unsafeGetDatasourceById } from 'db/datasource';
import { IdOrStr } from 'db/index';
import { getModelById } from 'db/model';
import { CollectionCreateBody, Distance, VectorResponseBody } from 'struct/vectorproxy';

class VectorDBProxyClient {
	// Method to create a collection
	static async createCollection(
		collectionId: IdOrStr,
		createOptions?: CollectionCreateBody
	): Promise<any> {
		log('createCollection %s %O', collectionId, createOptions);
		// Note: Checks if the collection exists beforehand
		const collectionExists: VectorResponseBody = await this.checkCollectionExists(collectionId);
		log('collectionExists res:', collectionExists);
		if (collectionExists?.error_message) {
			//TODO: have vector-db-poxy return a boolean or something logical for actually just knowing if the collection exists or not
			if (!createOptions) {
				//createOptions are optional as an optimisation where the data is already in scope
				const existingDatasource = await unsafeGetDatasourceById(collectionId);
				if (!existingDatasource) {
					throw new Error(
						`Datasource for datasourceId ${collectionId} for createCollection request`
					);
				}
				const existingModel = await getModelById(
					existingDatasource.teamId,
					existingDatasource.modelId
				);
				if (!existingModel) {
					throw new Error(
						`Model not found for modelId ${existingDatasource.modelId} for createCollection request`
					);
				}
				// Construct createOptions from existingDatasource and existingModel
				createOptions = {
					collection_name: collectionId.toString(),
					dimensions: existingModel.embeddingLength,
					distance: Distance.Cosine // As per the note: always cosine (for now)
					// vector_name: existingModel.model // This assumes vector_name is the model name
					// region: Region.US,
					// cloud: Cloud.GCP
				};
			}
		} else {
			log('Collection %s already exists', collectionId);
			return;
		}
		log('createOptions', createOptions);
		return fetch(`${process.env.VECTOR_APP_URL}/api/v1/create-collection/`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(createOptions)
		}).then(res => {
			log(res.status, res.statusText);
			return res.text();
		});
	}

	// Method to check collection exists
	static async checkCollectionExists(collectionId: IdOrStr): Promise<VectorResponseBody> {
		log('checkCollectionExists %s', collectionId);
		return fetch(
			`${process.env.VECTOR_APP_URL}/api/v1/check-collection-exists/${collectionId}`
		).then(res => {
			return res.json();
		});
	}

	// Method to get the total storage size for the team
	static async getVectorStorageForTeam(teamId: IdOrStr): Promise<VectorResponseBody> {
		log('getVectorStorageForTeam %s', teamId);
		return fetch(`${process.env.VECTOR_APP_URL}/api/v1/storage-size/${teamId}`).then(res => {
			return res.json();
		});
	}

	// Method to delete a collection
	static async deleteCollection(collectionId: IdOrStr): Promise<VectorResponseBody> {
		log('deleteCollection %s', collectionId);
		return fetch(`${process.env.VECTOR_APP_URL}/api/v1/collection/${collectionId}`, {
			method: 'DELETE'
		}).then(res => res.json());
	}
}

export default VectorDBProxyClient;
