'use strict';

import { OpenAPIClientAxios, Document } from 'openapi-client-axios';
import yaml from 'js-yaml';

const base64Credentials = Buffer.from(`${process.env.AIRBYTE_USERNAME}:${process.env.AIRBYTE_PASSWORD}`).toString('base64');

let client;
async function getAirbyteInternalApi() {
	if (client) {
		return client;
	}
	// Is there a JSON of this schema?
	const configYaml = await fetch('https://raw.githubusercontent.com/airbytehq/airbyte-platform/master/airbyte-api/src/main/openapi/config.yaml')
		.then(res => res.text());
	const definition = yaml.load(configYaml) as Document;
	const api = new OpenAPIClientAxios({
		definition,
		axiosConfigDefaults: {
			headers: {
				'authorization': `Basic ${base64Credentials}`,
			},
		},
	});
	client = await api.init();
	//NOTE: needs to use port 8000 url and append /api to work even though this is for the config api
	client.defaults.baseURL = `${process.env.AIRBYTE_WEB_URL}/api`;
	return client;
}

export default getAirbyteInternalApi;
