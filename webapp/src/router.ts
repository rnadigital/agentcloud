'use strict';

import bodyParser from 'body-parser';
import express, { Router } from 'express';
import fileUpload from 'express-fileupload';
import Permissions from 'permissions/permissions';

import checkResourceSlug from './lib/middleware/auth/checkresourceslug';
import checkSession from './lib/middleware/auth/checksession';
import csrfMiddleware from './lib/middleware/auth/csrf';
import fetchSession from './lib/middleware/auth/fetchsession';
import setPermissions from './lib/middleware/auth/setpermissions';
import useJWT from './lib/middleware/auth/usejwt';
import useSession from './lib/middleware/auth/usesession';
import homeRedirect from './lib/middleware/homeredirect';
import myPassport from './lib/middleware/mypassport';
import * as hasPerms from './lib/middleware/permissions/hasperms';
import renderStaticPage from './lib/middleware/render/staticpage';

const unauthedMiddlewareChain = [useSession, useJWT, fetchSession];
const authedMiddlewareChain = [...unauthedMiddlewareChain, checkSession, csrfMiddleware];

import * as accountController from 'controllers/account';
import * as agentController from 'controllers/agent';
import * as airbyteProxyController from 'controllers/airbyte';
import * as appController from 'controllers/app';
import * as credentialController from 'controllers/credential';
import * as datasourceController from 'controllers/datasource';
import * as modelController from 'controllers/model';
import * as notificationController from 'controllers/notification';
import * as sessionController from 'controllers/session';
import * as stripeController from 'controllers/stripe';
import * as taskController from 'controllers/task';
import * as teamController from 'controllers/team';
import * as toolController from 'controllers/tool';

export default function router(server, app) {

	// Stripe webhook handler
	server.post('/stripe-webhook', express.raw({type: 'application/json'}), stripeController.webhookHandler);

	// Oauth handlers
	server.use(myPassport.initialize());
	const oauthRouter = Router({ mergeParams: true, caseSensitive: true });
	oauthRouter.get('/redirect', useSession, useJWT, fetchSession, renderStaticPage(app, '/redirect'));
	oauthRouter.get('/github', useSession, useJWT, myPassport.authenticate('github'));
	oauthRouter.get('/github/callback', useSession, useJWT, myPassport.authenticate('github', { failureRedirect: '/login' }), fetchSession, (_req, res) => { res.redirect(`/auth/redirect?to=${encodeURIComponent('/account')}`); });
	oauthRouter.get('/google', useSession, useJWT, myPassport.authenticate('google', {
		scope: ['profile', 'email'],
	}));
	oauthRouter.get('/google/callback', useSession, useJWT, myPassport.authenticate('google', { failureRedirect: '/login' }), fetchSession, (_req, res) => { res.redirect(`/auth/redirect?to=${encodeURIComponent('/account')}`); });
	oauthRouter.get('/hubspot', useSession, useJWT, myPassport.authenticate('hubspot', {
		scope: 'crm.objects.line_items.read content crm.schemas.deals.read crm.schemas.line_items.read crm.objects.owners.read forms tickets crm.objects.marketing_events.read sales-email-read crm.objects.companies.read crm.lists.read crm.objects.deals.read crm.schemas.contacts.read crm.objects.contacts.read crm.schemas.companies.read crm.objects.quotes.read',
	}));
	oauthRouter.get('/hubspot/callback', useSession, useJWT, myPassport.authenticate('hubspot', { failureRedirect: '/login' }), fetchSession, (_req, res) => { res.redirect(`/auth/redirect?to=${encodeURIComponent('/account')}`); });
	oauthRouter.get('/stripe', useSession, useJWT, myPassport.authenticate('stripe'));
	oauthRouter.get('/stripe/callback', useSession, useJWT, myPassport.authenticate('stripe', { failureRedirect: '/login' }), fetchSession, (_req, res) => { res.redirect(`/auth/redirect?to=${encodeURIComponent('/account')}`); });
	server.use('/auth', useSession, myPassport.session(), oauthRouter);

	// Body and query parsing middleware
	server.set('query parser', 'simple');
	server.use(bodyParser.json({limit: '10mb'}));
	server.use(bodyParser.urlencoded({ extended: false }));
	// Default options for express-fileupload
	server.use(fileUpload());

	// Non team endpoints
	server.get('/', unauthedMiddlewareChain, homeRedirect);
	server.get('/login', unauthedMiddlewareChain, renderStaticPage(app, '/login'));
	server.get('/register', unauthedMiddlewareChain, renderStaticPage(app, '/register'));
	server.get('/verify', unauthedMiddlewareChain, renderStaticPage(app, '/verify'));
	server.get('/account', authedMiddlewareChain, accountController.accountPage.bind(null, app));
	server.get('/account.json', authedMiddlewareChain, accountController.accountJson);

	//Remove: for debug/testing, docker logs
	server.get('/logs.json', authedMiddlewareChain, accountController.dockerLogsJson);

	server.post('/stripe-paymentlink', authedMiddlewareChain, stripeController.createPaymentLink);
	server.post('/stripe-portallink', authedMiddlewareChain, stripeController.createPortalLink);

	// Account endpoints
	const accountRouter = Router({ mergeParams: true, caseSensitive: true });
	accountRouter.post('/login', unauthedMiddlewareChain, accountController.login);

	//TODO: remove
	accountRouter.post('/plan', authedMiddlewareChain, accountController.setPlanDebugApi);
	
	accountRouter.post('/register', unauthedMiddlewareChain, accountController.register);
	accountRouter.post('/requestchangepassword', unauthedMiddlewareChain, accountController.requestChangePassword);
	accountRouter.post('/changepassword', unauthedMiddlewareChain, accountController.changePassword);
	accountRouter.post('/verify', unauthedMiddlewareChain, accountController.verifyToken);
	accountRouter.post('/logout', authedMiddlewareChain, accountController.logout);
	accountRouter.post('/switch', authedMiddlewareChain, accountController.switchTeam);
	server.use('/forms/account', accountRouter);

	const teamRouter = Router({ mergeParams: true, caseSensitive: true });

	//airbyte proxy routes
	teamRouter.get('/airbyte/specification', airbyteProxyController.specificationJson);
	teamRouter.get('/airbyte/schema', airbyteProxyController.discoverSchemaApi);
	teamRouter.get('/airbyte/jobs', airbyteProxyController.listJobsApi);
	teamRouter.post('/airbyte/jobs', airbyteProxyController.triggerJobApi);

	//sessions
	teamRouter.get('/playground', sessionController.sessionsPage.bind(null, app));
	teamRouter.get('/session/:sessionId([a-f0-9]{24})/messages.json', sessionController.sessionMessagesJson);
	teamRouter.get('/session/:sessionId([a-f0-9]{24}).json', sessionController.sessionJson);
	teamRouter.get('/session/:sessionId([a-f0-9]{24})', sessionController.sessionPage.bind(null, app));
	teamRouter.get('/sessions.json', sessionController.sessionsJson);
	teamRouter.post('/forms/session/add', sessionController.addSessionApi);
	teamRouter.delete('/forms/session/:sessionId([a-f0-9]{24})', sessionController.deleteSessionApi);
	teamRouter.post('/forms/session/:sessionId([a-f0-9]{24})/cancel', sessionController.cancelSessionApi);

	//agents
	teamRouter.get('/agents', agentController.agentsPage.bind(null, app));
	teamRouter.get('/agents.json', agentController.agentsJson);
	teamRouter.get('/agent/add', agentController.agentAddPage.bind(null, app));
	teamRouter.get('/agent/:agentId([a-f0-9]{24}).json', agentController.agentJson);
	teamRouter.get('/agent/:agentId([a-f0-9]{24})/edit', agentController.agentEditPage.bind(null, app));
	teamRouter.post('/forms/agent/add', agentController.addAgentApi);
	teamRouter.post('/forms/agent/:agentId([a-f0-9]{24})/edit', agentController.editAgentApi);
	teamRouter.delete('/forms/agent/:agentId([a-f0-9]{24})', agentController.deleteAgentApi);

	//tasks
	teamRouter.get('/tasks', taskController.tasksPage.bind(null, app));
	teamRouter.get('/tasks.json', taskController.tasksJson);
	teamRouter.get('/task/add', taskController.taskAddPage.bind(null, app));
	teamRouter.get('/task/:taskId([a-f0-9]{24}).json', taskController.taskJson);
	teamRouter.get('/task/:taskId([a-f0-9]{24})/edit', taskController.taskEditPage.bind(null, app));
	teamRouter.post('/forms/task/add', taskController.addTaskApi);
	teamRouter.post('/forms/task/:taskId([a-f0-9]{24})/edit', taskController.editTaskApi);
	teamRouter.delete('/forms/task/:taskId([a-f0-9]{24})', taskController.deleteTaskApi);

	//apps
	teamRouter.get('/apps', appController.appsPage.bind(null, app));
	teamRouter.get('/apps.json', appController.appsJson);
	teamRouter.get('/app/add', appController.appAddPage.bind(null, app));
	teamRouter.get('/app/:appId([a-f0-9]{24}).json', appController.appJson);
	teamRouter.get('/app/:appId([a-f0-9]{24})/edit', appController.appEditPage.bind(null, app));
	teamRouter.post('/forms/app/add', appController.addAppApi);
	teamRouter.post('/forms/app/:appId([a-f0-9]{24})/edit', appController.editAppApi);
	teamRouter.delete('/forms/app/:appId([a-f0-9]{24})', appController.deleteAppApi);

	//credentials
	teamRouter.get('/credentials', credentialController.credentialsPage.bind(null, app));
	teamRouter.get('/credentials.json', credentialController.credentialsJson);
	teamRouter.get('/credential/add', credentialController.credentialAddPage.bind(null, app));
	teamRouter.get('/credential/:credentialId([a-f0-9]{24}).json', credentialController.credentialJson);
	teamRouter.post('/forms/credential/add', credentialController.addCredentialApi);
	teamRouter.delete('/forms/credential/:credentialId([a-f0-9]{24})', credentialController.deleteCredentialApi);

	//tools
	teamRouter.get('/tools', toolController.toolsPage.bind(null, app));
	teamRouter.get('/tools.json', toolController.toolsJson);
	teamRouter.get('/tool/add', toolController.toolAddPage.bind(null, app));
	teamRouter.get('/tool/:toolId([a-f0-9]{24}).json', toolController.toolJson);
	teamRouter.get('/tool/:toolId([a-f0-9]{24})/edit', toolController.toolEditPage.bind(null, app));
	teamRouter.post('/forms/tool/add', toolController.addToolApi);
	teamRouter.post('/forms/tool/:toolId([a-f0-9]{24})/edit', toolController.editToolApi);
	teamRouter.delete('/forms/tool/:toolId([a-f0-9]{24})', toolController.deleteToolApi);

	//models
	teamRouter.get('/models', modelController.modelsPage.bind(null, app));
	teamRouter.get('/models.json', modelController.modelsJson);
	teamRouter.get('/model/:modelId([a-f0-9]{24}).json', modelController.modelJson);
	teamRouter.get('/model/add', modelController.modelAddPage.bind(null, app));
	teamRouter.post('/forms/model/add', modelController.modelAddApi);
	teamRouter.post('/forms/model/:modelId([a-f0-9]{24})/edit', modelController.editModelApi);
	teamRouter.delete('/forms/model/:modelId([a-f0-9]{24})', modelController.deleteModelApi);

	//datasources
	teamRouter.get('/datasources', datasourceController.datasourcesPage.bind(null, app));
	teamRouter.get('/datasources.json', datasourceController.datasourcesJson);
	teamRouter.get('/datasource/add', datasourceController.datasourceAddPage.bind(null, app));
	teamRouter.get('/datasource/:datasourceId([a-f0-9]{24}).json', datasourceController.datasourceJson);
	teamRouter.get('/datasource/:datasourceId([a-f0-9]{24})/edit', datasourceController.datasourceEditPage.bind(null, app));
	teamRouter.post('/forms/datasource/upload', datasourceController.uploadFileApi);
	teamRouter.post('/forms/datasource/test', datasourceController.testDatasourceApi);
	teamRouter.post('/forms/datasource/add', datasourceController.addDatasourceApi);
	teamRouter.patch('/forms/datasource/:datasourceId([a-f0-9]{24})/streams', datasourceController.updateDatasourceStreamsApi);
	teamRouter.patch('/forms/datasource/:datasourceId([a-f0-9]{24})/schedule', datasourceController.updateDatasourceScheduleApi);
	teamRouter.post('/forms/datasource/:datasourceId([a-f0-9]{24})/sync', datasourceController.syncDatasourceApi);
	teamRouter.delete('/forms/datasource/:datasourceId([a-f0-9]{24})', datasourceController.deleteDatasourceApi);

	//team
	teamRouter.get('/team', teamController.teamPage.bind(null, app));
	teamRouter.get('/team.json', teamController.teamJson);
	teamRouter.get('/team/:memberId([a-f0-9]{24})/edit', hasPerms.one(Permissions.EDIT_TEAM_MEMBER), teamController.memberEditPage.bind(null, app));
	teamRouter.post('/forms/team/:memberId([a-f0-9]{24})/edit', hasPerms.one(Permissions.EDIT_TEAM_MEMBER), teamController.editTeamMemberApi);
	teamRouter.post('/forms/team/invite', teamController.inviteTeamMemberApi);
	teamRouter.delete('/forms/team/invite', teamController.deleteTeamMemberApi);
	teamRouter.post('/forms/team/add', teamController.addTeamApi);

	//notifications
	teamRouter.get('/notifications.json', notificationController.notificationsJson);
	teamRouter.patch('/forms/notification/seen', notificationController.markNotificationsSeenApi);

	// Airbyte webhooks
	const webhookRouter = Router({ mergeParams: true, caseSensitive: true });
	webhookRouter.use('/sync-successful', airbyteProxyController.handleSuccessfulSyncWebhook);
	webhookRouter.use('/embed-successful', airbyteProxyController.handleSuccessfulEmbeddingWebhook); //TODO: move these to webhooks controller?
	server.use('/webhook', webhookRouter);

	server.use('/:resourceSlug([a-f0-9]{24})', authedMiddlewareChain, checkResourceSlug, setPermissions, teamRouter);

}
