'use strict';

import { Router } from 'express';

import useJWT from './lib/middleware/auth/usejwt';
import useSession from './lib/middleware/auth/usesession';
import fetchSession from './lib/middleware/auth/fetchsession';
import checkSession from './lib/middleware/auth/checksession';
import checkResourceSlug from './lib/middleware/auth/checkresourceslug';
import renderStaticPage from './lib/middleware/render/staticpage';
import csrfMiddleware from './lib/middleware/auth/csrf';

//TODO: import { ... } from a controllers/index file?
import * as accountController from './controllers/account';
import * as groupController from './controllers/group';
import * as sessionController from './controllers/session';
import * as integrationController from './controllers/integrations';
import * as agentController from './controllers/agent';

export default function router(server, app) {

	/*
	 *
	 * Unauthed routes (WITHOUT checkSession)
	 *
	 */
	const unauthedMiddlewareChain  = [useSession, useJWT, fetchSession];
	server.get('/', unauthedMiddlewareChain, (_req, res, _next) => {
		const homeRedirect = res.locals.account
			? `/${res.locals.account.currentTeam}/sessions`
			: '/register';
		res.redirect(homeRedirect);
	});
	server.get('/login', unauthedMiddlewareChain, renderStaticPage(app, '/login'));
	server.get('/register', unauthedMiddlewareChain, renderStaticPage(app, '/register'));
	server.get('/verify', unauthedMiddlewareChain, renderStaticPage(app, '/verify'));

	const accountFormRouter = Router({ caseSensitive: true });
	accountFormRouter.post('/login', accountController.login);
	accountFormRouter.post('/register', accountController.register);
	accountFormRouter.post('/requestchangepassword', accountController.requestChangePassword);
	accountFormRouter.post('/changepassword', accountController.changePassword);
	accountFormRouter.post('/verify', accountController.verifyToken);
	accountFormRouter.post('/logout', checkSession, csrfMiddleware, accountController.logout);
	accountFormRouter.post('/switch', checkSession, csrfMiddleware, accountController.switchTeam);
	server.use('/forms/account', unauthedMiddlewareChain, accountFormRouter);

	/*
	 *
	 * Authed routes (with checkSession)
	 *
	 */
	const authedMiddlewareChain  = [useSession, useJWT, fetchSession, checkSession, csrfMiddleware];
	server.get('/account', authedMiddlewareChain, accountController.accountPage.bind(null, app));
	server.get('/socket', authedMiddlewareChain, accountController.socketTestPage.bind(null, app));
	server.get('/account.json', authedMiddlewareChain, accountController.accountJson);

	server.get('/integrations', authedMiddlewareChain, integrationController.integrationsPage.bind(null, app));
	server.get('/integrations.json', authedMiddlewareChain, integrationController.integrationsJson);
	
	const teamPagesRouter = Router({ caseSensitive: true });

	teamPagesRouter.get('/sessions', sessionController.sessionsPage.bind(null, app));
	teamPagesRouter.get('/session/:sessionId([a-f0-9]{24})/messages.json', sessionController.sessionMessagesJson);
	teamPagesRouter.get('/session/:sessionId([a-f0-9]{24}).json', sessionController.sessionJson);
	teamPagesRouter.get('/session/:sessionId([a-f0-9]{24})', sessionController.sessionPage.bind(null, app));
	teamPagesRouter.get('/sessions.json', sessionController.sessionsJson);

	teamPagesRouter.get('/agents', agentController.agentsPage.bind(null, app));
	teamPagesRouter.get('/agents.json', agentController.agentsJson);
	teamPagesRouter.get('/agent/add', agentController.agentAddPage.bind(null, app));
	teamPagesRouter.get('/agent/:agentId([a-f0-9]{24})/edit', agentController.agentEditPage.bind(null, app));
	
	teamPagesRouter.get('/groups', groupController.groupsPage.bind(null, app));
	teamPagesRouter.get('/groups.json', groupController.groupsJson);
	teamPagesRouter.get('/group/add', groupController.groupAddPage.bind(null, app));
	teamPagesRouter.get('/group/:groupId([a-f0-9]{24}).json', groupController.groupJson);
	teamPagesRouter.get('/group/:groupId([a-f0-9]{24})/edit', groupController.groupEditPage.bind(null, app));
	
	server.use('/:resourceSlug([a-f0-9]{24})', authedMiddlewareChain, checkResourceSlug, teamPagesRouter);

	const agentFormRouter = Router({ caseSensitive: true });
	agentFormRouter.post('/add', agentController.addAgentApi);
	agentFormRouter.post('/:agentId([a-f0-9]{24})/edit', agentController.editAgentApi);
	agentFormRouter.delete('/:agentId([a-f0-9]{24})', agentController.deleteAgentApi);
	server.use('/forms/agent', authedMiddlewareChain, agentFormRouter);
	
	const sessionFormRouter = Router({ caseSensitive: true });
	sessionFormRouter.post('/add', sessionController.addSessionApi);
	//agentFormRouter.post('/:sessionId([a-f0-9]{24})/edit', sessionController.editSessionApi);
	sessionFormRouter.delete('/:sessionId([a-f0-9]{24})', sessionController.deleteSessionApi);
	server.use('/forms/session', authedMiddlewareChain, sessionFormRouter);

	const groupFormRouter = Router({ caseSensitive: true });
	groupFormRouter.post('/add', groupController.addGroupApi);
	groupFormRouter.post('/:groupId([a-f0-9]{24})/edit', groupController.editGroupApi);
	groupFormRouter.delete('/:groupId([a-f0-9]{24})', groupController.deleteGroupApi);
	server.use('/forms/group', authedMiddlewareChain, groupFormRouter);

	const integrationFormRouter = Router({ caseSensitive: true });
	integrationFormRouter.post('/googleads', integrationController.addIntegrationApi);
	server.use('/forms/integrations/', authedMiddlewareChain, integrationFormRouter);

}
