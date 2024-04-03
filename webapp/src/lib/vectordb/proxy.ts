'use strict';

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

class VectorDBProxy {

	// Method to delete a collection from Qdrant
	static async deleteCollectionFromQdrant(collectionId: string) {
		return fetch(`${process.env.VECTOR_APP_URL}/api/v1/collection/${collectionId}`, {
			method: 'DELETE',
		});
	}

}

export default VectorDBProxy;
