import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import * as db from '../db/index';
import { addTeam, getTeamById, getTeamWithMembers } from '../db/team';
import { getAccountByEmail, setStripeCustomerId, setStripePlan } from '../db/account';
import { SubscriptionPlan } from '../lib/struct/billing';
import { getInitialData, makeFetch, fetchTypes, accountDetails, setInitialData, updateAllAccountCsrf} from './helpers';
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
    test("Test invalid models with FREE plan", async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account3_email
		);


        const stripeCustomerId = initialData?.accountData?.account?.stripe?.stripeCustomerId || "12345"; 
		const plan = SubscriptionPlan.FREE;
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


        expect(addModelResponse.status).toBe(403);
        expect(addModelResponseJson?.error).toBeDefined();
    });

    test.only("Test valid models with the FREE plan", async () => {
        const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account3_email
		);
		let body;

        let url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;
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
			accountDetails.account3_email,
			body
		);

        expect(addModelResponse.status).toBe(200);
		const addModelResponseJson = await addModelResponse.json();
		expect(addModelResponseJson?._id).toBeDefined();
		
		//clean up db with model delete
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/${addModelResponseJson._id}`;
		body = {
			modelId: addModelResponseJson._id
		}
		let response = await makeFetch(url, fetchTypes.DELETE, accountDetails.account3_email, body);
		expect(response.status).toBe(200);
    });

    

    test.only("Test valid embedding models with the FREE plan", async () => {
        const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account3_email
		);
		let addModelResponseJson, body, addModelResponse, url, deleteModelResponse;

		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;
		body = {
			name: 'testModel1-FREE-EMBED',
			model: 'text-embedding-3-small',
			config: {
				model: 'text-embedding-3-small',
				api_key: 'abcdefg-EMBED'
			},
			type: ModelType.OPENAI
		};

		addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account3_email,
			body
		);

        expect(addModelResponse.status).toBe(200);
		addModelResponseJson = await addModelResponse.json();
		expect(addModelResponseJson?._id).toBeDefined();

		//clean up after test
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/${addModelResponseJson._id}`;
		body = {
			modelId: addModelResponseJson._id
		};
		deleteModelResponse = await makeFetch(url, fetchTypes.DELETE, accountDetails.account3_email, body);
		expect(deleteModelResponse.status).toBe(200);
		
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;


		body = {
			name: 'testModel2-FREE-EMBED',
			model: 'text-embedding-3-large',
			config: {
				model: 'text-embedding-3-large',
				api_key: 'abcdefg-EMBED'
			},
			type: ModelType.OPENAI
		};

		addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account3_email,
			body
		);

        expect(addModelResponse.status).toBe(200);
		addModelResponseJson = await addModelResponse.json();
		expect(addModelResponseJson?._id).toBeDefined();
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/${addModelResponseJson._id}`;
		body = {
			modelId: addModelResponseJson._id
		};
		deleteModelResponse = await makeFetch(url, fetchTypes.DELETE, accountDetails.account3_email, body);
		expect(deleteModelResponse.status).toBe(200);
		
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;

		body = {
			name: 'testModel3-FREE-EMBED',
			model: 'text-embedding-ada-002',
			config: {
				model: 'text-embedding-ada-002',
				api_key: 'abcdefg-EMBED'
			},
			type: ModelType.OPENAI
		};

		addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account3_email,
			body
		);

        expect(addModelResponse.status).toBe(200);
		addModelResponseJson = await addModelResponse.json();
		expect(addModelResponseJson?._id).toBeDefined();
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/${addModelResponseJson._id}`;
		body = {
			modelId: addModelResponseJson._id
		};
		deleteModelResponse = await makeFetch(url, fetchTypes.DELETE, accountDetails.account3_email, body);
		expect(deleteModelResponse.status).toBe(200);
		
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;

    });


    //switch the plan to PRO, test adding invalid models for the PRO plan but should be able to add models that were off limits to the FREE plan
    test("Test invalid models with PRO plan", async ()=> {
        const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account3_email
		);

        //set org to pro plan
        const stripeCustomerId = initialData?.accountData?.account?.stripe?.stripeCustomerId || ""; 
		const plan = SubscriptionPlan.PRO;
		setStripeCustomerId(initialData?.accountData?.account?._id, stripeCustomerId);
		setStripePlan(stripeCustomerId, plan);
		let url, body, addModelResponse, addModelResponseJson;

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;
		body = {
			name: 'testModel1',
			model: 'gemini-1.5-pro',
			config: {
				model: 'gemini-1.5-pro',
				api_key: 'abcdefg'
			},
			type: ModelType.GOOGLE_AI
		};

		addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account3_email,
			body
		);
        addModelResponseJson = await addModelResponse.json();


        expect(addModelResponse.status).toBe(403);
        expect(addModelResponseJson?.error).toBeDefined();
    })

    test.only("Test valid models with PRO plan", async () => {
		const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account3_email
		);
		let addModelResponseJson, addModelResponse, url, body, deleteModelResponse;


        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;
		body = {
			name: 'testModel1',
			model: 'claude-3-5-sonnet-20240620',
			config: {
				model: 'claude-3-5-sonnet-20240620',
				api_key: 'abcdefg'
			},
			type: ModelType.ANTHROPIC
		};

		addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account3_email,
			body
		);


        expect(addModelResponse.status).toBe(200);
		addModelResponseJson = await addModelResponse.json();
		expect(addModelResponseJson._id).toBeDefined();
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/${addModelResponseJson._id}`;
		body = {
			modelId: addModelResponseJson._id
		};
		deleteModelResponse = await makeFetch(url, fetchTypes.DELETE, accountDetails.account3_email, body);
		expect(deleteModelResponse.status).toBe(200);
		
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;

    });


    //switch the plan to TEAMS, test adding valid models that are off limits for FREE and for PRO and add custom models
    test.only("Test all models with TEAMS plan", async ()=> {
        const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(
			accountDetails.account3_email
		);
		let addModelResponseJson, url, body, addModelResponse, deleteModelResponse;
        //set org to pro plan
        const stripeCustomerId = initialData?.accountData?.account?.stripe?.stripeCustomerId || ""; 
		const plan = SubscriptionPlan.TEAMS;
		setStripeCustomerId(initialData?.accountData?.account?._id, stripeCustomerId);
		setStripePlan(stripeCustomerId, plan);


        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;
        let config = {
            model: 'gpt-4o-mini',
            api_key: 'abcdefg'
        }
		body = {
			name: 'testModel1',
			model: 'gpt-4o-mini',
			config: config,
			type: ModelType.OPENAI
		};

		addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account3_email,
			body
		);

        expect(addModelResponse.status).toBe(200);
		addModelResponseJson = await addModelResponse.json();
		expect(addModelResponseJson._id).toBeDefined();
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/${addModelResponseJson._id}`;
		body = {
			modelId: addModelResponseJson._id
		};
		deleteModelResponse = await makeFetch(url, fetchTypes.DELETE, accountDetails.account3_email, body);
		expect(deleteModelResponse.status).toBe(200);
		
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;

        config = {
            model: 'fast-bge-small-en',
            api_key: 'abcdefg'
        }
	    body = {
			name: 'testModel1',
			model: 'fast-bge-small-en',
			config: config,
			type: ModelType.FASTEMBED
		};

		addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account3_email,
			body
		);

        expect(addModelResponse.status).toBe(200);
		addModelResponseJson = await addModelResponse.json();
		expect(addModelResponseJson._id).toBeDefined();
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/${addModelResponseJson._id}`;
		body = {
			modelId: addModelResponseJson._id
		};
		deleteModelResponse = await makeFetch(url, fetchTypes.DELETE, accountDetails.account3_email, body);
		expect(deleteModelResponse.status).toBe(200);
		
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;

        let ollamaConfig = {
            model: 'llama2',
            api_key: 'abcdefg',
            base_url: 'http://1234.com'
        }
	    body = {
			name: 'testModel1',
			model: 'llama2',
			config: ollamaConfig,
			type: ModelType.OLLAMA
		};

		addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account3_email,
			body
		);

        expect(addModelResponse.status).toBe(200);
		addModelResponseJson = await addModelResponse.json();
		expect(addModelResponseJson._id).toBeDefined();
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/${addModelResponseJson._id}`;
		body = {
			modelId: addModelResponseJson._id
		};
		deleteModelResponse = await makeFetch(url, fetchTypes.DELETE, accountDetails.account3_email, body);
		expect(deleteModelResponse.status).toBe(200);
		
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;

	    body = {
			name: 'testModel1',
			model: 'claude-3-5-sonnet-20240620',
			config: {
                model: 'claude-3-5-sonnet-20240620',
                api_key: 'abcdefg'
            },
			type: ModelType.ANTHROPIC
		};

		addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account3_email,
			body
		);

        expect(addModelResponse.status).toBe(200);
		addModelResponseJson = await addModelResponse.json();
		expect(addModelResponseJson._id).toBeDefined();
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/${addModelResponseJson._id}`;
		body = {
			modelId: addModelResponseJson._id
		};
		deleteModelResponse = await makeFetch(url, fetchTypes.DELETE, accountDetails.account3_email, body);
		expect(deleteModelResponse.status).toBe(200);
		
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;

        const groqConfig = {
            groq_api_key: 'abcdegs',
            model: 'llama3-70b-8192'
        }
	    body = {
            name: 'testModel1',
			model: 'llama3-70b-8192',
            //@ts-ignore
			config: groqConfig,
			type: ModelType.GROQ
		};

		addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account3_email,
			body
		);

        expect(addModelResponse.status).toBe(200);
		addModelResponseJson = await addModelResponse.json();
		expect(addModelResponseJson._id).toBeDefined();
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/${addModelResponseJson._id}`;
		body = {
			modelId: addModelResponseJson._id
		};
		deleteModelResponse = await makeFetch(url, fetchTypes.DELETE, accountDetails.account3_email, body);
		expect(deleteModelResponse.status).toBe(200);
		
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;

	    body = {
            name: 'testModel1',
			model: 'gemini-1.5-pro',
            //@ts-ignore
			config: {
                model: 'gemini-1.5-pro',
                //@ts-ignore
                credentials: 'creds',
                temperature: 0,
                location: 'SYD',
                project: 'project'
            },
			type: ModelType.GOOGLE_VERTEX
		};

		addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account3_email,
			body
		);
        expect(addModelResponse.status).toBe(200);
		addModelResponseJson = await addModelResponse.json();
		expect(addModelResponseJson._id).toBeDefined();
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/${addModelResponseJson._id}`;
		body = {
			modelId: addModelResponseJson._id
		};
		deleteModelResponse = await makeFetch(url, fetchTypes.DELETE, accountDetails.account3_email, body);
		expect(deleteModelResponse.status).toBe(200);
		
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;

	    body = {
            name: 'testModel1',
			model: 'gemini-1.5-pro',
			config: {
                model: 'gemini-1.5-pro',
                api_key: 'abcdefg'
            },
			type: ModelType.GOOGLE_AI
		};

		addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account3_email,
			body
		);

        expect(addModelResponse.status).toBe(200);
		addModelResponseJson = await addModelResponse.json();
		expect(addModelResponseJson._id).toBeDefined();
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/${addModelResponseJson._id}`;
		body = {
			modelId: addModelResponseJson._id
		};
		deleteModelResponse = await makeFetch(url, fetchTypes.DELETE, accountDetails.account3_email, body);
		expect(deleteModelResponse.status).toBe(200);
		
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;

	    body = {
            name: 'testModel1',
			model: 'gpt-4o-mini',
            //@ts-ignore
			config: {
                api_key: 'abcdefg',
                model: 'gpt-4o-mini',
                //@ts-ignore
                azure_endpoint: 'endpoint',
                azure_deployment: 'deployment',
                api_version: 'version'
            },
			type: ModelType.AZURE_OPENAI
		};

		addModelResponse = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account3_email,
			body
		);

        expect(addModelResponse.status).toBe(200);
		addModelResponseJson = await addModelResponse.json();
		expect(addModelResponseJson._id).toBeDefined();
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/${addModelResponseJson._id}`;
		body = {
			modelId: addModelResponseJson._id
		};
		deleteModelResponse = await makeFetch(url, fetchTypes.DELETE, accountDetails.account3_email, body);
		expect(deleteModelResponse.status).toBe(200);
		
		url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/forms/model/add`;

    })


});