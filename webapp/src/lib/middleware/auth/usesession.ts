'use strict';

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import RedisStore from 'connect-redis';
import session from 'express-session';
import { client as redisClient } from 'redis/redis';
const dev = process.env.NODE_ENV !== 'production';

const sessionStore = session({
	secret: process.env.COOKIE_SECRET,
	store: new RedisStore({
		prefix: 'sessions:',
		client: redisClient
	}),
	resave: false,
	saveUninitialized: false,
	rolling: true,
	cookie: {
		httpOnly: true,
		secure: false, //TODO: check https
		sameSite: 'lax',
		maxAge: 1000 * 60 * 60 * 24 * 30 //1 month
	}
});

export default function useSession(req, res, next) {
	if (!res.locals) {
		res.locals = {};
	}
	sessionStore(req, res, next);
}
