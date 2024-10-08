import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import * as db from '../db/index';
import { addTeam, getTeamById, getTeamWithMembers } from '../db/team';
import { getAccountByEmail, setStripeCustomerId, setStripePlan } from '../db/account';
import { SubscriptionPlan } from '../lib/struct/billing';
import { getInitialData, makeFetch, fetchTypes, accountDetails, setInitialData, updateAllAccountCsrf, wait } from './helpers';
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
//look in components/DropZone to see how the multipart form is created and how the file is uploaded
//use Fast Embed to reduce token usage for us and to also 
//use a self hosted runner in git to automate the tests into the PR process
beforeAll(()=>{
    updateAllAccountCsrf();
})

const SECONDS = 1000;

describe("Datasource Tests", () => {

    test.only("Upload a file", async ()=>{
        const account1Object = await getInitialData(accountDetails.account1_email);
        //create model to be used for embedding
        let body;
        let url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/model/add`;
        let config = {
            model: 'fast-bge-small-en',
            api_key: 'abcdefg'
        }
	    body = {
			name: 'testModel1',
			model: 'fast-bge-small-en',
			config: config,
			type: ModelType.FASTEMBED
		};

		let response = await makeFetch(
			url,
			fetchTypes.POST,
			accountDetails.account1_email,
			body
		);

        expect(response.status).toBe(200);

        let responseJson = await response.json();

        expect(responseJson?._id).toBeDefined();

        const modelId = responseJson?._id;

        const formData = new FormData();
        const fs = require('fs');
        const chunkingConfig = defaultChunkingOptions

        formData.set('resourceSlug', account1Object.resourceSlug as string);
        formData.set('modelId', modelId as string);
        formData.set('datasourceDescription', "File Upload Test Datasource");
        formData.set('name', "TestSource");
        formData.set('retriever', Retriever.RAW as string);
        formData.set('_csrf', account1Object.csrfToken as string);
        const filepath = path.resolve(__dirname, 'fileUpload.txt');
        const file = fs.readFileSync(filepath);

        formData.append('file', new Blob([file]), 'uploadTest.txt')
        Object.entries(chunkingConfig).forEach(([key, value]) => {
            if (value != null) {
                formData.set(key, value as string);
            }
        });
        
        url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/forms/datasource/upload`;
        
        response = await fetch(url, {
            headers: {
                cookie : account1Object.sessionCookie
            },
            method: 'POST',
            body: formData
        })

        expect(response.status).toBe(200);

        responseJson = await response.json();


        expect(responseJson?.datasourceId).toBeDefined();
        const datasourceId = responseJson.datasourceId;
        
        // //TODO: find a better way to wait for embedding to be completed
        // let ready=false;
        // while(!ready){
        //     url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/datasource/${datasourceId}.json`
        //     response = await makeFetch(url, fetchTypes.GET, accountDetails.account1_email);
        //     responseJson = await response.json();
        //     if(responseJson?.status === "ready"){
        //         ready = true;
        //         break;
        //     }
        //     else{
        //         wait(1 * SECONDS); //wait 1 second if the datasource isn't ready
        //     }
        // };
        //once the datasource is classed as ready then delete it to clean up the db and the vector-db
        url = `${process.env.WEBAPP_TEST_BASE_URL}/${account1Object.resourceSlug}/datasource/${datasourceId}`;
        body={
            datasourceId
        };
        response = await makeFetch(url, fetchTypes.DELETE, accountDetails.account1_email, body);
        expect(response.status).toBe(200);
    }, 60 * SECONDS);


    test.only("Make Connection", async () => {//make a connection with airbyte

    })
});