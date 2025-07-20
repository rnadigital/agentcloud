'use strict';

import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import SecretKeys from 'lib/secret/secretkeys';
import SecretProviderFactory from 'secret/index';
import { createLogger } from 'utils/logger';
const log = createLogger('webapp:email');

let amazonAccessID;
let amazonSecretAccessKey;
let sesClient;

export async function init() {
	try {
		const secretProvider = SecretProviderFactory.getSecretProvider();
		amazonAccessID = await secretProvider.getSecret(SecretKeys.AMAZON_ACCESS_ID);
		amazonSecretAccessKey = await secretProvider.getSecret(SecretKeys.AMAZON_SECRET_ACCESS_KEY);
		if (!amazonAccessID) {
			return;
		}
		sesClient = new SESClient({
			region: 'us-east-1',
			credentials: {
				accessKeyId: amazonAccessID,
				secretAccessKey: amazonSecretAccessKey
			}
		});
	} catch (e) {
		console.error(e);
		log.debug('No aws ses keys found in secret manager, emails disabled');
	}
}

export async function sendEmail(options) {
	if (!sesClient) {
		return;
	}
	log.info('Sending email', options);
	const emailParams = {
		Source: options.from,
		Destination: {
			BccAddresses: options.bcc,
			CcAddresses: options.cc,
			ToAddresses: options.to
		},
		Message: {
			Subject: {
				Data: options.subject
			},
			Body: {
				Html: {
					Data: options.body
				}
			}
		},
		ReplyToAddresses: options.replyTo
	};

	try {
		const command = new SendEmailCommand(emailParams);
		const response = await sesClient.send(command);
		return response;
	} catch (error) {
		throw error;
	}
}
