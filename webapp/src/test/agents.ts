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
import {Retriever} from '../lib/struct/tool';
import path from 'path';
import { defaultChunkingOptions } from '../lib/misc/defaultchunkingoptions';


beforeAll(()=>{
    updateAllAccountCsrf();
})

describe("Agents Tests", () => {
    test.only("Add an agent", async ()=>{
        const account1Object = await getInitialData(accountDetails.account1_email);

        const teamTools = await getToolsByTeam(account1Object.resourceSlug);
        const toolIds = teamTools.map(tool => (tool._id))

        console.log(toolIds);
    });

    test.only("Update an agent", async ()=>{

    });

    test.only("Can't add agent without permissions", async ()=>{

    });

    test.only("Can't edit agent without permissions", async ()=>{

    });

    test.only("Add an agent with invalid body", async ()=>{

    });

    test.only("Edit an agent with invalid body", async ()=>{

    });

    test.only("Add multiple agents", async ()=>{

    });

    test.only("Get agents (agents.json)", async ()=>{

    });

})