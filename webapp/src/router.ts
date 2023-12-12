'use strict';

import express, { Router } from 'express';

import useJWT from './lib/middleware/auth/usejwt';
import useSession from './lib/middleware/auth/usesession';
import fetchSession from './lib/middleware/auth/fetchsession';
import checkSession from './lib/middleware/auth/checksession';
import checkResourceSlug from './lib/middleware/auth/checkresourceslug';
import renderStaticPage from './lib/middleware/render/staticpage';
import csrfMiddleware from './lib/middleware/auth/csrf';
import homeRedirect from './lib/middleware/homeredirect';
import myPassport from './lib/middleware/mypassport';
import bodyParser from 'body-parser';

const unauthedMiddlewareChain = [useSession, useJWT, fetchSession];
const authedMiddlewareChain = [...unauthedMiddlewareChain, checkSession, csrfMiddleware];

//TODO: import { ... } from a controllers/index file?
import * as accountController from './controllers/account';
import * as groupController from './controllers/group';
import * as sessionController from './controllers/session';
import * as agentController from './controllers/agent';
import * as credentialController from './controllers/credential';
import * as stripeController from './controllers/stripe';
import * as toolController from './controllers/tool';
import * as datasourceController from './controllers/datasource';
import * as airbyteProxyController from './controllers/airbyte';

export default function router(server, app) {

	// Stripe webhook handler
	server.post('/stripe-webhook', express.raw({type: 'application/json'}), stripeController.webhookHandler);

	// Oauth handlers
	server.use(myPassport.initialize());
	const oauthRouter = Router({ mergeParams: true, caseSensitive: true });
	oauthRouter.get('/redirect', useSession, useJWT, fetchSession, renderStaticPage(app, '/redirect'));
	oauthRouter.get('/github', useSession, useJWT, myPassport.authenticate('github'));
	oauthRouter.get('/github/callback', useSession, useJWT, myPassport.authenticate('github', { failureRedirect: '/login' }), fetchSession, (_req, res) => { res.redirect(`/auth/redirect?to=${encodeURIComponent('/account')}`); });
	oauthRouter.get('/google', useSession, useJWT, myPassport.authenticate('google', { scope: ['profile', 'email'] }));
	oauthRouter.get('/google/callback', useSession, useJWT, myPassport.authenticate('google', { failureRedirect: '/login' }), fetchSession, (_req, res) => { res.redirect(`/auth/redirect?to=${encodeURIComponent('/account')}`); });
	server.use('/auth', useSession, myPassport.session(), oauthRouter);

	// Body and query parsing middleware
	server.set('query parser', 'simple');
	server.use(bodyParser.json({limit: '10mb'}));
	server.use(bodyParser.urlencoded({ extended: false }));

	// Non team endpoints
	server.get('/', unauthedMiddlewareChain, homeRedirect);
	server.get('/login', unauthedMiddlewareChain, renderStaticPage(app, '/login'));
	server.get('/register', unauthedMiddlewareChain, renderStaticPage(app, '/register'));
	server.get('/verify', unauthedMiddlewareChain, renderStaticPage(app, '/verify'));
	server.get('/account', authedMiddlewareChain, accountController.accountPage.bind(null, app));
	server.get('/account.json', authedMiddlewareChain, accountController.accountJson);
	server.post('/stripe-paymentlink', authedMiddlewareChain, stripeController.createPaymentLink);
	server.post('/stripe-portallink', authedMiddlewareChain, stripeController.createPortalLink);

	// Account endpoints
	const accountRouter = Router({ mergeParams: true, caseSensitive: true });
	accountRouter.post('/login', unauthedMiddlewareChain, accountController.login);
	accountRouter.post('/register', unauthedMiddlewareChain, accountController.register);
	accountRouter.post('/requestchangepassword', unauthedMiddlewareChain, accountController.requestChangePassword);
	accountRouter.post('/changepassword', unauthedMiddlewareChain, accountController.changePassword);
	accountRouter.post('/verify', unauthedMiddlewareChain, accountController.verifyToken);
	accountRouter.post('/logout', authedMiddlewareChain, accountController.logout);
	accountRouter.post('/switch', authedMiddlewareChain, accountController.switchTeam);
	server.use('/forms/account', accountRouter);

	// Team endpoints
	const teamRouter = Router({ mergeParams: true, caseSensitive: true });
	teamRouter.get('/airbyte/specification', airbyteProxyController.specificationJson);
	teamRouter.get('/sessions', sessionController.sessionsPage.bind(null, app));
	teamRouter.get('/session/:sessionId([a-f0-9]{24})/messages.json', sessionController.sessionMessagesJson);
	teamRouter.get('/session/:sessionId([a-f0-9]{24}).json', sessionController.sessionJson);
	teamRouter.get('/session/:sessionId([a-f0-9]{24})', sessionController.sessionPage.bind(null, app));
	teamRouter.get('/sessions.json', sessionController.sessionsJson);
	teamRouter.get('/agents', agentController.agentsPage.bind(null, app));
	teamRouter.get('/agents.json', agentController.agentsJson);
	teamRouter.get('/agent/add', agentController.agentAddPage.bind(null, app));
	teamRouter.get('/agent/:agentId([a-f0-9]{24})/edit', agentController.agentEditPage.bind(null, app));
	teamRouter.get('/groups', groupController.groupsPage.bind(null, app));
	teamRouter.get('/groups.json', groupController.groupsJson);
	teamRouter.get('/group/add', groupController.groupAddPage.bind(null, app));
	teamRouter.get('/group/:groupId([a-f0-9]{24}).json', groupController.groupJson);
	teamRouter.get('/group/:groupId([a-f0-9]{24})/edit', groupController.groupEditPage.bind(null, app));
	teamRouter.get('/credentials', credentialController.credentialsPage.bind(null, app));
	teamRouter.get('/credentials.json', credentialController.credentialsJson);
	teamRouter.get('/credential/add', credentialController.credentialAddPage.bind(null, app));
	teamRouter.get('/credential/:credentialId([a-f0-9]{24}).json', credentialController.credentialJson);
	teamRouter.get('/tools', toolController.toolsPage.bind(null, app));
	teamRouter.get('/tools.json', toolController.toolsJson);
	teamRouter.get('/tool/add', toolController.toolAddPage.bind(null, app));
	teamRouter.get('/tool/:toolId([a-f0-9]{24}).json', toolController.toolJson);
	teamRouter.get('/tool/:toolId([a-f0-9]{24})/edit', toolController.toolEditPage.bind(null, app));
	teamRouter.get('/datasources', datasourceController.datasourcesPage.bind(null, app));
	teamRouter.get('/datasources.json', datasourceController.datasourcesJson);
	teamRouter.get('/datasource/add', datasourceController.datasourceAddPage.bind(null, app));
	teamRouter.get('/datasource/:datasourceId([a-f0-9]{24}).json', datasourceController.datasourceJson);
	teamRouter.get('/datasource/:datasourceId([a-f0-9]{24})/edit', datasourceController.datasourceEditPage.bind(null, app));
	teamRouter.post('/forms/agent/add', agentController.addAgentApi);
	teamRouter.post('/forms/agent/:agentId([a-f0-9]{24})/edit', agentController.editAgentApi);
	teamRouter.delete('/forms/agent/:agentId([a-f0-9]{24})', agentController.deleteAgentApi);
	teamRouter.post('/forms/credential/add', credentialController.addCredentialApi);
	teamRouter.delete('/forms/credential/:credentialId([a-f0-9]{24})', credentialController.deleteCredentialApi);
	teamRouter.post('/forms/session/add', sessionController.addSessionApi);
	teamRouter.delete('/forms/session/:sessionId([a-f0-9]{24})', sessionController.deleteSessionApi);
	teamRouter.post('/forms/tool/add', toolController.addToolApi);
	teamRouter.post('/forms/tool/:toolId([a-f0-9]{24})/edit', toolController.editToolApi);
	teamRouter.delete('/forms/tool/:toolId([a-f0-9]{24})', toolController.deleteToolApi);
	teamRouter.post('/forms/group/add', groupController.addGroupApi);
	teamRouter.post('/forms/group/:groupId([a-f0-9]{24})/edit', groupController.editGroupApi);
	teamRouter.delete('/forms/group/:groupId([a-f0-9]{24})', groupController.deleteGroupApi);
	server.use('/:resourceSlug([a-f0-9]{24})', authedMiddlewareChain, checkResourceSlug, teamRouter);

}
