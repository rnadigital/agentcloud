'use strict';

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { IdOrStr } from 'db/index';
import { CollectionInfo } from 'struct/qdrant';

class VectorDBProxy {

	// Method to create a collection in Qdrant
	static async createCollectionInQdrant(collectionId: IdOrStr): Promise<Response> {
		return fetch(`${process.env.VECTOR_APP_URL}/api/v1/check-collection-exists/${collectionId}`, {
			method: 'POST',
		});
	}

	// Method to get collection details
	static async getCollectionFromQdrant(collectionId: IdOrStr): Promise<Response> {
		return fetch(`${process.env.VECTOR_APP_URL}/api/v1/collection/${collectionId}`, {
			method: 'GET',
		});
	}

	// Method to get collection info
	static async getCollectionInfoFromQdrant(collectionId: IdOrStr): Promise<CollectionInfo> {
		return fetch(`${process.env.VECTOR_APP_URL}/api/v1/collection-info/${collectionId}`, {
			method: 'GET',
		}).then(res => res.json());
	}

	// Method to delete a collection from Qdrant
	static async deleteCollectionFromQdrant(collectionId: IdOrStr): Promise<Response> {
		return fetch(`${process.env.VECTOR_APP_URL}/api/v1/collection/${collectionId}`, {
			method: 'DELETE',
		});
	}

}

export default VectorDBProxy;
