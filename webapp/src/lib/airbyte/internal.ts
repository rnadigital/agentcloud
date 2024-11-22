'use strict';

import debug from 'debug';
import fs from 'fs';
import yaml from 'js-yaml';
import { Document, OpenAPIClientAxios } from 'openapi-client-axios';

import { getAirbyteAuthToken } from './api';

// Read the YAML file synchronously and load it into configYaml
const configYaml = fs.readFileSync(__dirname + '/definition-internal.yaml', 'utf8');
// Load the YAML content into a definition object
const definition = yaml.load(configYaml) as Document;
const log = debug('webapp:lib:airbyte:internal');

let client;
async function getAirbyteInternalApi() {
	if (client) {
		return client;
	}
	const api = new OpenAPIClientAxios({
		definition,
		axiosConfigDefaults: {
			headers: {
				authorization: `Bearer ${await getAirbyteAuthToken()}`
			}
		}
	});
	client = await api.init();
	const airbyteApiUrl = process.env.AIRBYTE_API_URL;

	log('airbyteApiUrl: %s', airbyteApiUrl);
	log('client.defaults.baseUrl: %s', client.defaults.baseURL);
	if (process.env.AIRBYTE_API_URL !== 'https://cloud.airbyte.com') {
		client.defaults.baseURL = `${process.env.AIRBYTE_API_URL}/api`;
	}
	return client;
}

export default getAirbyteInternalApi;
