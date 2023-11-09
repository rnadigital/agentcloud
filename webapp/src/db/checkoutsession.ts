'use strict';

import * as db from './index';
import { ObjectId } from 'mongodb';
import toObjectId from '../lib/misc/toobjectid';

export type CheckoutSession = {
	_id?: ObjectId;
	accountId?: ObjectId;
	checkoutSessionId: string;
	payload: any; //TODO: make this use stripe typings?
};

export function CheckoutSessionCollection() {
	return db.db().collection('checkoutsessions');
}

export function getCheckoutSessionById(accountId: db.IdOrStr, checkoutSessionId: string): Promise<CheckoutSession> {
	return CheckoutSessionCollection().findOne({
		checkoutSessionId: checkoutSessionId,
		accountId: toObjectId(accountId),
	});
}

export function unsafeGetCheckoutSessionById(checkoutSessionId: string): Promise<CheckoutSession> {
	return CheckoutSessionCollection().findOne({
		checkoutSessionId: checkoutSessionId,
	});
}

export async function addCheckoutSession(checkoutSession: CheckoutSession): Promise<db.InsertResult> {
	return CheckoutSessionCollection().insertOne(checkoutSession);
}

export function deleteCheckoutSessionById(accountId: db.IdOrStr, checkoutSessionId: string): Promise<any> {
	return CheckoutSessionCollection().deleteOne({
		checkoutSessionId: checkoutSessionId,
		accountId: toObjectId(accountId),
	});
}
