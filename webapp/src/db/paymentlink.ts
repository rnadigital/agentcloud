'use strict';

import * as db from './index';
import { ObjectId } from 'mongodb';
import toObjectId from '../lib/misc/toobjectid';

export type PaymentLink = {
	_id?: ObjectId;
	accountId?: ObjectId;
	paymentLinkId: string;
	url: string;
	payload: any; //TODO: make this use stripe typings?
};

export function PaymentLinkCollection() {
	return db.db().collection('paymentlinks');
}

export function getPaymentLinkById(accountId: db.IdOrStr, paymentLinkId: string): Promise<PaymentLink> {
	return PaymentLinkCollection().findOne({
		paymentLinkId: paymentLinkId,
		accountId: toObjectId(accountId),
	});
}

export function unsafeGetPaymentLinkById(paymentLinkId: string): Promise<PaymentLink> {
	return PaymentLinkCollection().findOne({
		paymentLinkId: paymentLinkId,
	});
}

export async function addPaymentLink(paymentLink: PaymentLink): Promise<db.InsertResult> {
	return PaymentLinkCollection().insertOne(paymentLink);
}

export function deletePaymentLinkById(accountId: db.IdOrStr, paymentLinkId: string): Promise<any> {
	return PaymentLinkCollection().deleteOne({
		paymentLinkId: paymentLinkId,
		accountId: toObjectId(accountId),
	});
}
