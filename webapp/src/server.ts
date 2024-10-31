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
		try {
			await airbyteSetup.init();
		} catch (error) {
			console.error('Error initializing airbyteSetup:', error);
		}

		try {
			await db.connect();
		} catch (error) {
			console.error('Error connecting to the database:', error);
		}

		try {
			await migrate();
		} catch (error) {
			console.error('Error during migration:', error);
		}

		const secretProvider = SecretProviderFactory.getSecretProvider();
		try {
			await secretProvider.init(); //Note: secret provider is first because it needs to be inited for e.g. stripe client to use
		} catch (error) {
			console.error('Error initializing secret provider:', error);
		}

		// try {
		// 	await StripeClient.init();
		// } catch (error) {
		// 	console.error('Error initializing Stripe client:', error);
		// }

		// const storageProvider = StorageProviderFactory.getStorageProvider();
		// try {
		// 	await storageProvider.init();
		// } catch (error) {
		// 	console.error('Error initializing storage provider:', error);
		// }

		// const messageQueueProvider = MessageQueueProviderFactory.getMessageQueueProvider();
		// try {
		// 	await messageQueueProvider.init();
		// } catch (error) {
		// 	console.error('Error initializing message queue provider:', error);
		// }

		// const functionProvider = FunctionProviderFactory.getFunctionProvider();
		// try {
		// 	await functionProvider.init();
		// } catch (error) {
		// 	console.error('Error initializing function provider:', error);
		// }

		// try {
		// 	await initGlobalTools();
		// } catch (error) {
		// 	console.error('Error initializing global tools:', error);
		// }

		// try {
		// 	await ses.init();
		// } catch (error) {
		// 	console.error('Error initializing SES:', error);
		// }

		// try {
		// 	await PassportManager.init();
		// } catch (error) {
		// 	console.error('Error initializing PassportManager:', error);
		// }

		// try {
		// 	await resyncAllDatasources();
		// } catch (error) {
		// 	console.error('Error resyncing all datasources:', error);
		// }

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
