'use strict';

import { Redis } from 'ioredis';

export const client: Redis = new Redis({
	host: process.env.REDIS_HOST || '127.0.0.1',
	port: parseInt(process.env.REDIS_PORT) || 6379,
	password: process.env.REDIS_PASS || '',
	db: 0 //optional
});

export function close() {
	client.quit();
}

//get a value with key
export function get(key) {
	return client.get(key).then(res => {
		return JSON.parse(res);
	});
}

//get a hash value
export function hgetall(key) {
	return client.hgetall(key).then(res => {
		return res;
	});
}

//get a hash value
export function hget(key, hash) {
	return client.hget(key, hash).then(res => {
		return JSON.parse(res);
	});
}

//set a hash value
export function hset(key, hash, value) {
	return client.hset(key, hash, JSON.stringify(value));
}

//delete a hash
export function hdel(key, hash) {
	return client.hdel(key, hash);
}

//set a value on key
export function set(key, value, expiry?) {
	if (expiry) {
		return client.setex(key, expiry, JSON.stringify(value));
	}
	return client.set(key, JSON.stringify(value));
}

//set an expiration for a key
export function expire(key, ttl) {
	return client.expire(key, ttl);
}

//delete value with key
export function del(keyOrKeys) {
	if (Array.isArray(keyOrKeys)) {
		return client.del(...keyOrKeys);
	} else {
		return client.del(keyOrKeys);
	}
}
