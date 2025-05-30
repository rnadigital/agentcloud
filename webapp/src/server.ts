'use strict';

process.on('uncaughtException', console.error).on('unhandledRejection', console.error);

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
// import { getShortCommitHash } from './lib/commit';
// if (!process.env.NEXT_PUBLIC_SHORT_COMMIT_HASH) {
// 	try {
// 		process.env.NEXT_PUBLIC_SHORT_COMMIT_HASH = getShortCommitHash();
// 	} catch (e) {
// 		console.warn(
// 			'NEXT_PUBLIC_SHORT_COMMIT_HASH not set, and failed to call getShortCommitHash:',
// 			e
// 		);
// 	}
// }

import express from 'express';
import * as http from 'http';
import next from 'next';
const dev = process.env.NODE_ENV !== 'production',
	hostname = 'localhost',
	port = 3000,
	app = next({ dev, hostname, port }),
	handle = app.getRequestHandler();

import { dynamicResponse } from '@dr';
import PassportManager from '@mw/passportmanager';
import { initSocket } from '@socketio';
import * as db from 'db/index';
import { migrate } from 'db/migrate';
import { initGlobalTools } from 'db/tool';
import debug from 'debug';
import * as airbyteSetup from 'lib/airbyte/setup';
import * as ses from 'lib/email/ses';
import FunctionProviderFactory from 'lib/function';
import MessageQueueProviderFactory from 'lib/queue';
import * as redis from 'lib/redis/redis';
import SecretProviderFactory from 'lib/secret';
import StorageProviderFactory from 'lib/storage';
import StripeClient from 'lib/stripe';
import { resyncAllDatasources } from 'utils/resync';
import { v4 as uuidv4 } from 'uuid';

const log = debug('webapp:server');

app
	.prepare()
	.then(async () => {
		
		await airbyteSetup.init();
		await db.connect();
		await db.connectMongooseDB();
		await migrate();
		const secretProvider = SecretProviderFactory.getSecretProvider();
		await secretProvider.init(); //Note: secret provider is first because it needs to be inited for e.g. stripe client to use
		await StripeClient.init();
		const storageProvider = StorageProviderFactory.getStorageProvider();
		await storageProvider.init();
		const messageQueueProvider = MessageQueueProviderFactory.getMessageQueueProvider();
		await messageQueueProvider.init();
		const functionProvider = FunctionProviderFactory.getFunctionProvider();
		await functionProvider.init();
		await initGlobalTools();
		await ses.init();
		await PassportManager.init();
		await resyncAllDatasources();

		const server = express();
		const rawHttpServer: http.Server = http.createServer(server);
		initSocket(rawHttpServer);

		server.disable('x-powered-by');
		server.set('trust proxy', 1);

		server.all('/_next/*', (req, res) => {
			return handle(req, res);
		});
		const router = (await import('./router')).default;

		router(server, app);

		server.all('*', (req, res) => {
			return handle(req, res);
		});

		server.use((err, req, res, _next) => {
			//TODO: remove
			const uuid = uuidv4();
			console.error('An error occurred', uuid, err);
			return dynamicResponse(req, res, 400, {
				error: `An error occurred. Please contact support with code: ${uuid}`
			});
		});

		rawHttpServer.listen(parseInt(process.env.EXPRESS_PORT), process.env.EXPRESS_HOST, () => {
			if (typeof process.send === 'function') {
				log('SENT READY SIGNAL TO PM2');
				process.send('ready');
			}
			log(
				`Ready on http${dev ? '' : 's'}://${process.env.EXPRESS_HOST}:${process.env.EXPRESS_PORT}`
			);
		});

		//graceful stop handling
		const gracefulStop = () => {
			log('SIGINT SIGNAL RECEIVED');
			db.client().close();
			redis.close();
			process.exit(0);
		};
		process.on('SIGINT', gracefulStop);
		process.on('message', message => {
			if (message === 'shutdown') {
				gracefulStop();
			}
		});
	})
	.catch(err => {
		console.error(err.stack);
		process.exit(1);
	});
