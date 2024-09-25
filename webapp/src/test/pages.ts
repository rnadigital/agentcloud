import {afterAll, beforeAll, describe, expect, test} from '@jest/globals';
import * as db from '../db/index';
import { makeFetch, fetchTypes, setInitialData, getInitialData, accountDetails } from './helpers';
import dotenv from 'dotenv';
import { URLSearchParams } from 'url';

dotenv.config({ path: '.env' });
let sessionCookie;

const SECONDS = 1000;

describe('page tests', () => {

    //need to store IDs in a new map or object to retrieve them here for the session pages and the edit pages
    test('pages that dont need resourceslug', async () => {
        const { resourceSlug } = await getInitialData(accountDetails.account1_email);
        let url = `${process.env.WEBAPP_TEST_BASE_URL}/account.json`;
		let response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);

        expect(response.status).toBe(200);

        
        url = `${process.env.WEBAPP_TEST_BASE_URL}/account`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        url = `${process.env.WEBAPP_TEST_BASE_URL}/welcome`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        url = `${process.env.WEBAPP_TEST_BASE_URL}/billing`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);


    }, 60 * SECONDS);

    test('apikeys pages', async () => {
        const { resourceSlug } = await getInitialData(accountDetails.account1_email);
        let url, response;


        url = `${process.env.WEBAPP_TEST_BASE_URL}/apikey/add`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        url = `${process.env.WEBAPP_TEST_BASE_URL}/apikeys`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        url = `${process.env.WEBAPP_TEST_BASE_URL}/apikeys`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

    });

    test('onboarding pages', async () => {
        const { resourceSlug } = await getInitialData(accountDetails.account1_email);
        let url, response;

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/onboarding`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/onboarding/configuremodels`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);
    })
    
    test('agents pages', async () => {
        const { resourceSlug } = await getInitialData(accountDetails.account1_email);
        let url, response;

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/agents`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/agent/add`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        // url = `${process.env.WEBAPP_TEST_BASE_URL}/agent/:agentId([a-f0-9]{24})`;
    })
    
    test('tasks pages', async () => {
        const { resourceSlug } = await getInitialData(accountDetails.account1_email);
        let url, response;

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/tasks`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/task/add`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        // url = `${process.env.WEBAPP_TEST_BASE_URL}/task/:taskId([a-f0-9]{24})`;
    })
    
    test('apps pages', async () => {
        const { resourceSlug } = await getInitialData(accountDetails.account1_email);
        let url, response;

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/apps`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/app/add`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        // url = `${process.env.WEBAPP_TEST_BASE_URL}/app/:appId([a-f0-9]{24})/edit`;
    })
    
    test('tools pages', async () => {
        const { resourceSlug } = await getInitialData(accountDetails.account1_email);
        let url, response;


        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/tools`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/tool/add`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        // url = `${process.env.WEBAPP_TEST_BASE_URL}/tool/:toolId([a-f0-9]{24})/edit`;
    })
    
    
    test('models pages', async () => {
        const { resourceSlug } = await getInitialData(accountDetails.account1_email);
        let url, response;


        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/models`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/model/add`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        // url = `${process.env.WEBAPP_TEST_BASE_URL}/model/:modelId([a-f0-9]{24})/edit`;
    })
    
    test('datasource pages', async () => {
        const { resourceSlug } = await getInitialData(accountDetails.account1_email);
        let url, response;

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/datasources`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/datasource/add`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        // url = `${process.env.WEBAPP_TEST_BASE_URL}/datasource/:datasourceId([a-f0-9]{24})/edit`;
    })
    
    test('team pages', async () => {
        const { resourceSlug } = await getInitialData(accountDetails.account1_email);
        let url, response;

        url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/team`;
        response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        expect(response.status).toBe(200);

        // url = `${process.env.WEBAPP_TEST_BASE_URL}/team/:memebrId([a-f0-9]{24})/edit`;
    })
    
    //TODO: Keep id of all sharing types within sessions/apps, check that the session pages can/can't be accessed accordingly
    test('session pages', async () => {
        const { resourceSlug } = await getInitialData(accountDetails.account1_email);
        let url, response;

        // url = `${process.env.WEBAPP_TEST_BASE_URL}/session/:sessionId([a-f0-9]{24})`; for public sessions

        // url = `${process.env.WEBAPP_TEST_BASE_URL}/${resourceSlug}/session/:sessionId([a-f0-9]{24})`; for teamRouter sessions        
        
        expect(1).toBe(1);
    })

});