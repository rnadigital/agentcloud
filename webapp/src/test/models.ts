import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import * as db from '../db/index';
import { addTeam, getTeamById, getTeamWithMembers } from '../db/team';
import { getAccountByEmail, setStripeCustomerId, setStripePlan } from '../db/account';
import { SubscriptionPlan } from '../lib/struct/billing';
import { getInitialData, makeFetch, fetchTypes, accountDetails, setInitialData, updateAllAccountCsrf } from './helpers';
import dotenv from 'dotenv';
import { URLSearchParams } from 'url';
import toObjectId from '../lib/misc/toobjectid';
import { ModelList, ModelType } from '../lib/struct/model';
import { ShareLinkTypes } from '../lib/struct/sharelink';
import { getToolsByTeam } from "../db/tool";
import { TeamRoles } from "../lib/permissions/roles"

dotenv.config({ path: '.env' });

afterAll(async () => {
	await db.db().collection('accounts').deleteMany({ 
		email: { 
			$in: [
				accountDetails.account1_email,
				accountDetails.account2_email,
				accountDetails.account3_email,
				accountDetails.account4_email,
				accountDetails.account5_email,
				accountDetails.account6_email,
				accountDetails.account7_email,
				accountDetails.account8_email,
				accountDetails.account9_email,
				accountDetails.account10_email,
				accountDetails.account11_email
			] 
		}
	});
	await db.client().close();
});

describe('Model Tests', () => {

    //test model creation with invalid models on TEAMS plan

    //test 
});