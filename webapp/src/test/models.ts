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

beforeAll(async ()=>{
    updateAllAccountCsrf(); //update csrf token to make sure an expired token isn't used in the tests
})


describe('Model Tests', () => {

    //switch the plan back down to FREE, test adding invalid models for the FREE plan
    test.only("Test invalid models with FREE plan", async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account3_email
		); //account3's default org and team is on the free plan, should have "CREATE_MODEL" permissions


        const stripeCustomerId = 'sk_12345'; //testing flags set stripe customer ID to null, need to set it to set the plan
		const plan = SubscriptionPlan.TEAMS;
		setStripeCustomerId(initialData?.accountData?.account?._id, stripeCustomerId);
		setStripePlan(stripeCustomerId, plan);
        let url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;
		let body = {
			name: 'testModel1',
			model: 'claude-3-5-sonnet-20240620',
			config: {
				model: 'claude-3-5-sonnet-20240620',
				api_key: 'abcdefg'
			},
			type: ModelType.ANTHROPIC
		};

		const addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account3_email,
			body
		);
        const addModelResponseJson = await addModelResponse.json();
        console.log(addModelResponseJson);

        expect(addModelResponse.status).toBe(403);
        expect(addModelResponseJson?.error).toBeDefined();
    });

    test.only("Test valid models with the FREE plan", async () => {
        const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account3_email
		); //account3's default org and team is on the free plan, should have "CREATE_MODEL" permissions

        let url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;
		let body = {
			name: 'testModel1',
			model: 'gpt-4o',
			config: {
				model: 'gpt-4o',
				api_key: 'abcdefg'
			},
			type: ModelType.OPENAI
		};

		const addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account3_email,
			body
		);

        expect(addModelResponse.status).toBe(200);
    });

    //test the same thing with embedding models and FREE plan

    //switch the plan to PRO, test adding invalid models for the PRO plan but should be able to add models that were off limits to the FREE plan

    //test the same thing with embedding models and the PRO plan

    //switch the plan to TEAMS, test adding valid models that are off limits for FREE and for PRO and add custom models

    //test the same thing with embedding models too

});