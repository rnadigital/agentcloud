'use strict';

import debug from 'debug';
const log = debug('webapp:fetchDatasource');

export default async function fetchDatasource(req, res, next) {
	// Store datasourceName and datasourceDescription in the session if they exist in the query, this is used to get the datasource name, description and other relevant data from the datasourceModal between the webapp and the oauth callback
	if (req.query.datasourceName && req.query.datasourceDescription) {
		req.session.oauthData = {
			datasourceName: req.query.datasourceName as string,
			datasourceDescription: req.query.datasourceDescription as string
		};
		log('Stored oauthData in session:', req.session.oauthData);
	}

	next();
}
