'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

import dotenv from 'dotenv';
//TODO Add asyc later
dotenv.config({ path: '.env' });

import * as http from 'http';
import express from 'express';
import next from 'next';
const dev = process.env.NODE_ENV !== 'production'
	, hostname = 'localhost'
	, port = 3000
	, app = next({ dev, hostname, port })
	, handle = app.getRequestHandler();

import bodyParser from 'body-parser';
import * as redis from './redis';
import { initSocket } from './socketio';
import * as db from './db';
import router from './router';
import { v4 as uuidv4 } from 'uuid';
import * as ses from './lib/email/ses';
import debug from 'debug';
const log = debug('webapp:http');

app.prepare()
	.then(async () => {

		await db.connect();
		await ses.init();

		const server = express();
		const rawHttpServer: http.Server = http.createServer(server);
		initSocket(rawHttpServer);

		server.set('query parser', 'simple');
		server.use(bodyParser.json()); // for parsing application/json
		server.use(bodyParser.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded
		server.disable('x-powered-by');
		server.set('trust proxy', 1);

		server.all('/_next/*', (req, res) => {
			return handle(req, res);
		});

		router(server, app);

		server.all('*', (req, res) => {
			return handle(req, res);
		});

		server.use((err, _req, res, _next) => {
			const uuid = uuidv4();
			console.error('An error occurred', uuid, err);
			return res.send('An error occurred. Please contact support with code: '+uuid);
		});

		rawHttpServer.listen(3000, '0.0.0.0', () => { //TODO: configurable
			if (typeof process.send === 'function') {
				log('SENT READY SIGNAL TO PM2');
				process.send('ready');
			}
			log('Ready on http://0.0.0.0:3000');
		});

		//graceful stop handling
		const gracefulStop = () => {
			log('SIGINT SIGNAL RECEIVED');
			db.client().close();
			redis.close();
			process.exit(0);
		};
		process.on('SIGINT', gracefulStop);
		process.on('message', (message) => {
			if (message === 'shutdown') {
				gracefulStop();
			}
		});

	})
	.catch(err => {
		console.error(err.stack);
		process.exit(1);
	});
