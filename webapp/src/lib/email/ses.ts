'use strict';

import * as aws from 'aws-sdk';
import { getSecret } from '../secret/secretmanager';
import SecretKeys from '../secret/secretkeys';

let amazonAccessID;
let amazonSecretAccessKey;
let ses;

export async function init() {
	amazonAccessID = await getSecret(SecretKeys.AMAZON_ACCESSKEYID);
	amazonSecretAccessKey = await getSecret(SecretKeys.AMAZON_SECRETACCESSKEY);	
	if (!amazonAccessID) { return; }
	await aws.config.update({
		region: 'us-east-1',
		accessKeyId: amazonAccessID,
		secretAccessKey: amazonSecretAccessKey,
	});
	ses = new aws.SES({
		apiVersion: 'latest'
	});
}

export function sendEmail(options) {
	if (!ses) { return; }
	return new Promise((res, rej) => {
		ses.sendEmail({
			Source: options.from,
			Destination: {
				BccAddresses: options.bcc,
				CcAddresses: options.cc,
				ToAddresses: options.to,
			},
			Message: {
				Subject: {
					Data: options.subject,
				},
				Body: {
					Html: {
						Data: options.body,
					},
				},
			},
			ReplyToAddresses: options.replyTo,
		}, (err, info) => {
			if (err) {
				rej(err);
			} else if (info != null) {
				res(info);
			} else {
				rej(new Error('Error in ses email sending'));
			}
		});
	});
}
