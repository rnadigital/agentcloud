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

    //test the same thing with embedding models and FREE plan

    //switch the plan to PRO, test adding invalid models for the PRO plan but should be able to add models that were off limits to the FREE plan

    //test the same thing with embedding models and the PRO plan

    //switch the plan to TEAMS, test adding valid models that are off limits for FREE and for PRO and add custom models

    //test the same thing with embedding models too

    //test

});