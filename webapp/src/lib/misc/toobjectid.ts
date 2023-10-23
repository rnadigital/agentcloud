'usestrict';

import { ObjectId } from 'mongodb';

export default function toObjectId(str: string | ObjectId) {
	return typeof str === 'string' ? new ObjectId(str) : str;
}
