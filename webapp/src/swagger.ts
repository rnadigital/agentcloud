import { inspect } from 'node:util';

import fs from 'fs';
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
	failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Agentcloud Webapp API Docs',
			version: '0.1.6'
		},
		license: {
			name: 'GNU Affero General Public License v3.0 only',
			url: 'https://www.gnu.org/licenses/agpl-3.0.txt'
		}
	},
	apis: ['./src/controllers/*.ts', './src/lib/struct/*.ts'] // files containing annotations as above
};

const openapiSpecification = swaggerJsdoc(options);
console.log(inspect(openapiSpecification, true, 10));
// Convert the openapiSpecification object to JSON and write it to a file
fs.writeFileSync('./openapi-spec.json', JSON.stringify(openapiSpecification, null, 2), 'utf-8');

console.log('OpenAPI specification written to openapi-spec.json');
