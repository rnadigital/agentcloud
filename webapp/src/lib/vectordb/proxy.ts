'use strict';

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

//TODO: make this a whole API

export async function deleteCollectionFromQdrant(collectionId: string) {
	return fetch(`${process.env.VECTOR_APP_URL}/api/v1/collection/${collectionId}`, {
		method: 'DELETE',
	});
}

export async function getDatasourceVectors(collectionId: string) {
	return fetch(`${process.env.VECTOR_APP_URL}/api/v1/scroll/${collectionId}`, {
		method: 'GET',
	});
}
