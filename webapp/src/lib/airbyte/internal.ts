'use strict';

import fs from 'fs';
import yaml from 'js-yaml';
import { Document, OpenAPIClientAxios } from 'openapi-client-axios';

// Read the YAML file synchronously and load it into configYaml
const configYaml = fs.readFileSync(__dirname + '/definition-internal.yaml', 'utf8');
// Load the YAML content into a definition object
const definition = yaml.load(configYaml) as Document;

const base64Credentials = Buffer.from(
	`${process.env.AIRBYTE_USERNAME.trim()}:${process.env.AIRBYTE_PASSWORD.trim()}`
).toString('base64');

let client;
async function getAirbyteInternalApi() {
	if (client) {
		return client;
	}
	const api = new OpenAPIClientAxios({
		definition,
		axiosConfigDefaults: {
			headers: {
				authorization: `Basic ${base64Credentials}`
			}
		}
	});
	client = await api.init();
	client.defaults.baseURL = `${process.env.AIRBYTE_WEB_URL}/api`;
	return client;
}

export default getAirbyteInternalApi;
