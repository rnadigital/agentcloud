'use strict';

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

export default async function deleteCollectionFromQdrant(collectionId: string) {
	//TODO: make this a whole API
	return fetch(`${process.env.VECTOR_APP_URL}/collection/${collectionId}`, {
		method: 'DELETE',
	});
}
