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
import * as agentController from './controllers/agent';
import * as credentialController from './controllers/credential';

export default function router(server, app) {

	/*
	 *
	 * Unauthed routes (WITHOUT checkSession)
	 *
	 */
	const unauthedMiddlewareChain = [useSession, useJWT, fetchSession];
	const authedMiddlewareChain = [...unauthedMiddlewareChain, checkSession, csrfMiddleware];

	server.get('/', unauthedMiddlewareChain, (_req, res, _next) => {
		const homeRedirect = res.locals.account
			? `/${res.locals.account.currentTeam}/sessions`
			: '/register';
		res.redirect(homeRedirect);
	});
	server.get('/login', unauthedMiddlewareChain, renderStaticPage(app, '/login'));
	server.get('/register', unauthedMiddlewareChain, renderStaticPage(app, '/register'));
	server.get('/verify', unauthedMiddlewareChain, renderStaticPage(app, '/verify'));
	server.get('/account', authedMiddlewareChain, accountController.accountPage.bind(null, app));
	server.get('/socket', authedMiddlewareChain, accountController.socketTestPage.bind(null, app));
	server.get('/account.json', authedMiddlewareChain, accountController.accountJson);

	const accountFormRouter = Router({ caseSensitive: true });
	accountFormRouter.post('/login', unauthedMiddlewareChain, accountController.login);
	accountFormRouter.post('/register', unauthedMiddlewareChain, accountController.register);
	accountFormRouter.post('/requestchangepassword', unauthedMiddlewareChain, accountController.requestChangePassword);
	accountFormRouter.post('/changepassword', unauthedMiddlewareChain, accountController.changePassword);
	accountFormRouter.post('/verify', unauthedMiddlewareChain, accountController.verifyToken);
	accountFormRouter.post('/logout', authedMiddlewareChain, accountController.logout);
	accountFormRouter.post('/switch', authedMiddlewareChain, accountController.switchTeam);
	accountFormRouter.post('/token', authedMiddlewareChain, accountController.setToken);
	server.use('/forms/account', accountFormRouter);
	
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
	teamPagesRouter.get('/credentials', credentialController.credentialsPage.bind(null, app));
	teamPagesRouter.get('/credentials.json', credentialController.credentialsJson);
	teamPagesRouter.get('/credential/add', credentialController.credentialAddPage.bind(null, app));
	teamPagesRouter.get('/credential/:credentialId([a-f0-9]{24}).json', credentialController.credentialJson);
	server.use('/:resourceSlug([a-f0-9]{24})', authedMiddlewareChain, checkResourceSlug, teamPagesRouter);

	const agentFormRouter = Router({ caseSensitive: true });
	agentFormRouter.post('/add', agentController.addAgentApi);
	agentFormRouter.post('/:agentId([a-f0-9]{24})/edit', agentController.editAgentApi);
	agentFormRouter.delete('/:agentId([a-f0-9]{24})', agentController.deleteAgentApi);
	server.use('/forms/agent', authedMiddlewareChain, agentFormRouter);
	
	const credentialFormRouter = Router({ caseSensitive: true });
	credentialFormRouter.post('/add', credentialController.addCredentialApi);
	credentialFormRouter.delete('/:credentialId([a-f0-9]{24})', credentialController.deleteCredentialApi);
	server.use('/forms/credential', authedMiddlewareChain, credentialFormRouter);
	
	const sessionFormRouter = Router({ caseSensitive: true });
	sessionFormRouter.post('/add', sessionController.addSessionApi);
	sessionFormRouter.delete('/:sessionId([a-f0-9]{24})', sessionController.deleteSessionApi);
	server.use('/forms/session', authedMiddlewareChain, sessionFormRouter);

	const groupFormRouter = Router({ caseSensitive: true });
	groupFormRouter.post('/add', groupController.addGroupApi);
	groupFormRouter.post('/:groupId([a-f0-9]{24})/edit', groupController.editGroupApi);
	groupFormRouter.delete('/:groupId([a-f0-9]{24})', groupController.deleteGroupApi);
	server.use('/forms/group', authedMiddlewareChain, groupFormRouter);

}
