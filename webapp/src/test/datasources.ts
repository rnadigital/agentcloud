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
//look in components/DropZone to see how the multipart form is created and how the file is uploaded
//use Fast Embed to reduce token usage for us and to also 
//use a self hosted runner in git to automate the tests into the PR process
beforeAll(()=>{
})

describe("Datasource Tests", () => {

    test.only("Upload a file", async ()=>{
        const account1Object = await getInitialData(accountDetails.account1_email);
        const formData = new FormData();
        const fs = require('fs');
        const chunkingConfig = defaultChunkingOptions

        formData.set('resourceSlug', account1Object.resourceSlug as string);
        // formData.set('modelId', ) need to create a valid embedding model and get that modelId
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
        
        let url = `${process.env.WEBAPP_TEST_URL}/${account1Object.resourceSlug}/forms/datasource/upload`
    })
});