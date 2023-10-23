'use strict';

//TODO: rethink auth
export default function checkResourceSlug(req, res, next) {
	console.log(req.params.resourceSlug, res.locals.account.currentTeam);
	if (req.params.resourceSlug.toString() !== res.locals.account.currentTeam.toString()) {
		//TODO: change team if account has it in the org/teams list , else reject
		return res.status(403).send({ error: 'Invalid resourceSlug' });
	}
	next();
}
