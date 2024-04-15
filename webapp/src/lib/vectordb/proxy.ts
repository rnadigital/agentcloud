'use strict';

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { IdOrStr } from 'db/index';

class VectorDBProxy {

	// Method to create a collection in Qdrant
	static async createCollectionInQdrant(collectionId: IdOrStr) {
		return fetch(`${process.env.VECTOR_APP_URL}/api/v1/check-collection-exists/${collectionId}`, {
			method: 'POST',
		});
	}

	// Method to delete a collection from Qdrant
	static async deleteCollectionFromQdrant(collectionId: IdOrStr) {
		return fetch(`${process.env.VECTOR_APP_URL}/api/v1/collection/${collectionId}`, {
			method: 'DELETE',
		});
	}

}

export default VectorDBProxy;
