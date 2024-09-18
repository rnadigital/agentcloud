import {afterAll, beforeAll, describe, expect, test} from '@jest/globals';
import * as db from '../db/index';
import dotenv from 'dotenv';
import { URLSearchParams } from 'url';

//delete user account after all tests finished and close db connection
afterAll(async () => {
	await db.db().collection('accounts').deleteOne({ email: 'testuser@example.com' });
	await db.client().close();
});
