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


beforeAll(async ()=>{
    updateAllAccountCsrf(); //update csrf token to make sure an expired token isn't used in the tests
})

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

describe("log out and wrap up tests", ()=>{
    
    test('log out', async () => {
        const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
            accountDetails.account1_email
        );
    
        const url = `${process.env.WEBAPP_TEST_BASE_URL}/forms/account/logout`;
        const body = {
            _csrf: csrfToken
        };
    
        const response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
    
        const responseJson = await response.json();
        expect(responseJson?.redirect).toBeDefined();
        expect(response.status).toBe(200);
    });
    
    test('cant get account with invalidated session cookie', async () => {
        const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
            accountDetails.account1_email
        );
    
        const url = `${process.env.WEBAPP_TEST_BASE_URL}/account.json`;
        const response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(302); //302 redirect to login
    });
})
