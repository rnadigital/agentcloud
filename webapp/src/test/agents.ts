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
    test.only("Can't add agent with empty modelid", async ()=>{
        const account1Object = await getInitialData(accountDetails.account1_email);

        const teamTools = await getToolsByTeam(account1Object.resourceSlug);
        const toolIds = teamTools.map(tool => (tool._id))

        let body, url, response, responseJson;
        url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/agent/add`
        body = {
            toolIds,
            name: "AddBasicAgent",
            role: "AddBasicAgent",
            goal: "AddBasicAgent",
            backstory: "AddBasicAgent",
            modelId: '', //emptymodelId
        }

        response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
        expect(response.status).toBe(400);
    });

    test.only("Can't add agent with invalid modelid", async ()=>{
        const account1Object = await getInitialData(accountDetails.account1_email);

        const teamTools = await getToolsByTeam(account1Object.resourceSlug);
        const toolIds = teamTools.map(tool => (tool._id))

        let body, url, response, responseJson;
        url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/agent/add`
        body = {
            toolIds,
            name: "AddBasicAgent",
            role: "AddBasicAgent",
            goal: "AddBasicAgent",
            backstory: "AddBasicAgent",
            modelId: 'aaaaaaaaaaaaaaaaaaaaaaaa', //this modelId doesn't exist
        }

        response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
        expect(response.status).toBe(400);
    });

    test.only("add with valid modelId", async ()=>{
        const account1Object = await getInitialData(accountDetails.account1_email);
        let body, url, response, responseJson;
        url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/model/add`;
		body = {
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
			accountDetails.account1_email,
			body
		);

        expect(addModelResponse.status).toBe(200);
        responseJson = await addModelResponse.json();
        expect(responseJson?._id).toBeDefined();
        const modelId = responseJson._id; //the added item ID of the model

        const teamTools = await getToolsByTeam(account1Object.resourceSlug);
        const toolIds = teamTools.map(tool => (tool._id))

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/agent/add`
        body = {
            toolIds,
            name: "AddBasicAgent",
            role: "AddBasicAgent",
            goal: "AddBasicAgent",
            backstory: "AddBasicAgent",
            modelId
        }

        response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
        expect(response.status).toBe(200); //successfully add model
        responseJson = await response.json();
        expect(responseJson?._id).toBeDefined(); //make sure that the 200 response isn't a redirect to login or any other response than a success for adding agent

        //clean up tests by removing agent and model that were added
        url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/agent/${responseJson._id}`;
        body={
            agentId: responseJson._id
        };
        response = await makeFetch(url, fetchTypes.DELETE, accountDetails.account1_email, body);
        expect(response.status).toBe(200);

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/model/${modelId}`;
        body = {
            modelId
        }

        response = await makeFetch(url, fetchTypes.DELETE, accountDetails.account1_email, body);
        expect(response.status).toBe(200);
    });

    test.only("can't add agent with invalid permissions", async ()=>{
        const account1Object = await getInitialData(accountDetails.account1_email);
        let body, url, response, responseJson;
        url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/model/add`;
		body = {
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
			accountDetails.account1_email,
			body
		);

        expect(addModelResponse.status).toBe(200);
        responseJson = await addModelResponse.json();
        expect(responseJson?._id).toBeDefined();
        const modelId = responseJson._id; //the added item ID of the model

        const teamTools = await getToolsByTeam(account1Object.resourceSlug);
        const toolIds = teamTools.map(tool => (tool._id))

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/agent/add`
        body = {
            toolIds,
            name: "AddBasicAgent",
            role: "AddBasicAgent",
            goal: "AddBasicAgent",
            backstory: "AddBasicAgent",
            modelId
        }

        response = await makeFetch(url, fetchTypes.POST, accountDetails.account1_email, body);
        expect(response.status).toBe(200); //successfully add model
        responseJson = await response.json();
        expect(responseJson?._id).toBeDefined(); //make sure that the 200 response isn't a redirect to login or any other response than a success for adding agent
    });

    test.only("Update an agent", async ()=>{

    });

    test.only("Can't add agent without permissions", async ()=>{

    });

    test.only("Can't edit agent without permissions", async ()=>{

    });

    test.only("Edit an agent with invalid body", async ()=>{

    });

    test.only("Add multiple agents", async ()=>{

    });

    test.only("Get agents (agents.json)", async ()=>{

    });

})