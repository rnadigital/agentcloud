'use strict';

import { SendEmailCommand,SESClient } from '@aws-sdk/client-ses';
import debug from 'debug';
import SecretKeys from 'secret/secretkeys';
import { getSecret } from 'secret/secretmanager';
const log = debug('webapp:email');

let amazonAccessID;
let amazonSecretAccessKey;
let sesClient;

export async function init() {
	try {
		amazonAccessID = await getSecret(SecretKeys.AMAZON_ACCESSKEYID);
		amazonSecretAccessKey = await getSecret(SecretKeys.AMAZON_SECRETACCESSKEY);
		log('amazonAccessID', amazonAccessID);
		log('amazonSecretAccessKey', amazonSecretAccessKey);
		if (!amazonAccessID) { return; }
		sesClient = new SESClient({
			region: 'us-east-1',
			credentials: {
				accessKeyId: amazonAccessID,
				secretAccessKey: amazonSecretAccessKey,
			}
		});
	} catch (e) {
		console.error(e);
		log('No aws ses keys found in gcp secret manager, emails disabled');
	}
}

export async function sendEmail(options) {
	if (!sesClient) { return; }
	log('Sending email', options);
	const emailParams = {
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
	};

	try {
		const command = new SendEmailCommand(emailParams);
		const response = await sesClient.send(command);
		return response;
	} catch (error) {
		throw error;
	}
}
