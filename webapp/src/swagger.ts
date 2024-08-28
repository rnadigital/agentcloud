import {inspect} from 'node:util';
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agentcloud Webapp API Docs',
      version: '0.1.6',
    },
    license: {
        name: 'GNU Affero General Public License v3.0 only',
        url: 'https://www.gnu.org/licenses/agpl-3.0.txt'
    }
  },
  apis: ['./src/controllers/*.ts', './src/lib/struct/*.ts'], // files containing annotations as above
};

const openapiSpecification = swaggerJsdoc(options);
console.log(inspect(openapiSpecification, true, 10))