'use strict';

import {
	checkResourceSlug,
	checkResourceSlugQuery,
	setDefaultOrgAndTeam,
	setParamOrgAndTeam
} from '@mw/auth/checkresourceslug';
import checkSession from '@mw/auth/checksession';
import {
	checkSubscriptionBoolean,
	checkSubscriptionLimit,
	checkSubscriptionPlan,
	fetchUsage,
	setSubscriptionLocals
} from '@mw/auth/checksubscription';
import csrfMiddleware from '@mw/auth/csrf';
import fetchSession from '@mw/auth/fetchsession';
import setPermissions from '@mw/auth/setpermissions';
import useJWT from '@mw/auth/usejwt';
import useSession from '@mw/auth/usesession';
import onboardedMiddleware from '@mw/checkonboarded';
import homeRedirect from '@mw/homeredirect';
import PassportManager from '@mw/passportmanager';
import * as hasPerms from '@mw/permissions/hasperms';
import renderStaticPage from '@mw/render/staticpage';
import bodyParser from 'body-parser';
import express, { Router } from 'express';
import fileUpload from 'express-fileupload';
import Permissions from 'permissions/permissions';
import { PlanLimitsKeys, pricingMatrix, SubscriptionPlan } from 'struct/billing';

const unauthedMiddlewareChain = [useSession, useJWT, fetchSession, onboardedMiddleware];
const authedMiddlewareChain = [...unauthedMiddlewareChain, checkSession, csrfMiddleware];

import checkSessionWelcome from '@mw/auth/checksessionwelcome';
import * as accountController from 'controllers/account';
import * as agentController from 'controllers/agent';
import * as airbyteProxyController from 'controllers/airbyte';
import * as apiKeyController from 'controllers/apikey';
import * as appController from 'controllers/app';
import * as assetController from 'controllers/asset';
import * as datasourceController from 'controllers/datasource';
import * as modelController from 'controllers/model';
import * as notificationController from 'controllers/notification';
import * as orgController from 'controllers/org';
import * as sessionController from 'controllers/session';
import * as sharelinkController from 'controllers/sharelink';
import * as stripeController from 'controllers/stripe';
import * as taskController from 'controllers/task';
import * as teamController from 'controllers/team';
import * as toolController from 'controllers/tool';
import * as variableController from 'controllers/variables';
import * as vectorDbController from 'controllers/vectordb';

export default function router(server, app) {
	server.use('/static', express.static('static'));
	server.use('/tmp', express.static('/tmp'));

	// Stripe webhook handler
	server.post(
		'/stripe-webhook',
		express.raw({ type: 'application/json' }),
		stripeController.webhookHandler
	);

	// Oauth handlers
	const passportInstance = PassportManager.getPassport();
	server.use(passportInstance.initialize());
	const oauthRouter = Router({ mergeParams: true, caseSensitive: true });
	oauthRouter.get(
		'/redirect',
		useSession,
		useJWT,
		fetchSession,
		renderStaticPage(app, '/redirect')
	);
	oauthRouter.get('/github', useSession, useJWT, passportInstance.authenticate('github'));
	oauthRouter.get(
		'/github/callback',
		useSession,
		useJWT,
		passportInstance.authenticate('github', { failureRedirect: '/login' }),
		fetchSession,
		(_req, res) => {
			res.redirect(`/auth/redirect?to=${encodeURIComponent('/')}`);
		}
	);
	oauthRouter.get(
		'/google',
		useSession,
		useJWT,
		passportInstance.authenticate('google', {
			scope: ['profile', 'email']
		})
	);
	oauthRouter.get(
		'/google/callback',
		useSession,
		useJWT,
		passportInstance.authenticate('google', { failureRedirect: '/login' }),
		fetchSession,
		(_req, res) => {
			res.redirect(`/auth/redirect?to=${encodeURIComponent('/')}`);
		}
	);
	server.use('/auth', useSession, passportInstance.session(), oauthRouter);

	// Body and query parsing middleware
	server.set('query parser', 'simple');
	server.use(bodyParser.json({ limit: '10mb' }));
	server.use(bodyParser.urlencoded({ extended: false }));
	// Default options for express-fileupload
	server.use(
		fileUpload({
			limits: { fileSize: pricingMatrix[SubscriptionPlan.ENTERPRISE].maxFileUploadBytes }
		})
	);

	// Non team endpoints
	server.get('/', unauthedMiddlewareChain, homeRedirect);
	server.get(
		'/login',
		unauthedMiddlewareChain,
		checkSessionWelcome,
		renderStaticPage(app, '/login')
	);
	server.get(
		'/register',
		unauthedMiddlewareChain,
		checkSessionWelcome,
		renderStaticPage(app, '/register')
	);
	server.get('/verify', unauthedMiddlewareChain, renderStaticPage(app, '/verify'));
	server.get(
		'/account',
		unauthedMiddlewareChain,
		setDefaultOrgAndTeam,
		checkSession,
		setSubscriptionLocals,
		csrfMiddleware,
		accountController.accountPage.bind(null, app)
	);
	server.get(
		'/welcome',
		unauthedMiddlewareChain,
		setDefaultOrgAndTeam,
		checkSession,
		setSubscriptionLocals,
		csrfMiddleware,
		accountController.welcomePage.bind(null, app)
	);
	server.get(
		'/billing',
		unauthedMiddlewareChain,
		setDefaultOrgAndTeam,
		checkSession,
		setSubscriptionLocals,
		csrfMiddleware,
		accountController.billingPage.bind(null, app)
	);
	server.get(
		'/account.json',
		authedMiddlewareChain,
		checkResourceSlugQuery,
		setPermissions,
		accountController.accountJson
	);
	server.get(
		'/welcome.json',
		authedMiddlewareChain,
		setDefaultOrgAndTeam,
		checkSession,
		setSubscriptionLocals,
		csrfMiddleware,
		accountController.welcomeJson
	);

	//TODO: move and rename all these
	server.post(
		'/stripe-portallink',
		unauthedMiddlewareChain,
		setDefaultOrgAndTeam,
		checkSession,
		setSubscriptionLocals,
		csrfMiddleware,
		stripeController.createPortalLink
	);
	server.post(
		'/stripe-plan',
		unauthedMiddlewareChain,
		setDefaultOrgAndTeam,
		checkSession,
		setSubscriptionLocals,
		csrfMiddleware,
		stripeController.requestChangePlan
	);
	server.post(
		'/stripe-plan-confirm',
		unauthedMiddlewareChain,
		setDefaultOrgAndTeam,
		checkSession,
		setSubscriptionLocals,
		csrfMiddleware,
		stripeController.confirmChangePlan
	);
	server.get(
		'/stripe-has-paymentmethod',
		unauthedMiddlewareChain,
		setDefaultOrgAndTeam,
		checkSession,
		setSubscriptionLocals,
		csrfMiddleware,
		stripeController.hasPaymentMethod
	);
	server.get(
		'/stripe-ready',
		unauthedMiddlewareChain,
		setDefaultOrgAndTeam,
		checkSession,
		setSubscriptionLocals,
		csrfMiddleware,
		stripeController.checkReady
	);

	// Account endpoints
	const accountRouter = Router({ mergeParams: true, caseSensitive: true });
	accountRouter.post('/login', unauthedMiddlewareChain, accountController.login);
	accountRouter.post('/register', unauthedMiddlewareChain, accountController.register);
	accountRouter.post(
		'/requestchangepassword',
		unauthedMiddlewareChain,
		accountController.requestChangePassword
	);
	accountRouter.post('/changepassword', unauthedMiddlewareChain, accountController.changePassword);
	accountRouter.post('/verify', unauthedMiddlewareChain, accountController.verifyToken);
	accountRouter.post(
		'/logout',
		unauthedMiddlewareChain,
		setDefaultOrgAndTeam,
		checkSession,
		setSubscriptionLocals,
		csrfMiddleware,
		accountController.logout
	);
	accountRouter.post(
		'/switch',
		unauthedMiddlewareChain,
		setDefaultOrgAndTeam,
		checkSession,
		setSubscriptionLocals,
		setPermissions,
		csrfMiddleware,
		accountController.switchTeam
	);

	accountRouter.post(
		'/role',
		authedMiddlewareChain,
		checkResourceSlugQuery,
		setPermissions,
		accountController.updateRole
	);
	
	accountRouter.post(
		'/onboard', 
		authedMiddlewareChain,
		checkResourceSlugQuery,
		setPermissions,
	 	accountController.onboardUser
	);

	// api key endpoints
	accountRouter.post('/apikey/add', authedMiddlewareChain, apiKeyController.addKeyApi);
	accountRouter.delete(
		'/apikey/:keyId([a-f0-9]{24})',
		authedMiddlewareChain,
		apiKeyController.deleteKeyApi
	);
	accountRouter.post(
		'/apikey/:keyId([a-f0-9]{24})/increment',
		authedMiddlewareChain,
		apiKeyController.incrementKeyApi
	);

	server.use('/forms/account', accountRouter);
	server.get('/apikey/add', authedMiddlewareChain, apiKeyController.keyAddPage.bind(null, app));

	server.get('/apikeys', authedMiddlewareChain, apiKeyController.apiKeysPage.bind(null, app));
	server.get('/apikeys.json', authedMiddlewareChain, apiKeyController.apikeysJson);

	// public session endpoints
	const publicAppRouter = Router({ mergeParams: true, caseSensitive: true });
	publicAppRouter.get(
		'/session/:sessionId([a-f0-9]{24})',
		csrfMiddleware,
		setParamOrgAndTeam,
		setPermissions,
		sessionController.publicSessionPage.bind(null, app)
	);
	publicAppRouter.get(
		'/session/:sessionId([a-f0-9]{24})/messages.json',
		csrfMiddleware,
		setParamOrgAndTeam,
		setPermissions,
		sessionController.publicSessionMessagesJson
	);
	//TODO: csrf?
	publicAppRouter.post(
		'/forms/session/:sessionId([a-f0-9]{24})/edit',
		setParamOrgAndTeam,
		setPermissions,
		sessionController.editSessionApi
	);
	publicAppRouter.get(
		'/session/:sessionId([a-f0-9]{24}).json',
		csrfMiddleware,
		setParamOrgAndTeam,
		setPermissions,
		sessionController.sessionJson
	);
	publicAppRouter.post(
		'/forms/session/:sessionId([a-f0-9]{24})/start',
		setParamOrgAndTeam,
		setPermissions,
		sessionController.startSession
	);

	publicAppRouter.get(
		'/:shareLinkShareId(app_[a-f0-9]{64,})', //Note: app_prefix to be removed once we handle other sharinglinktypes
		csrfMiddleware,
		setParamOrgAndTeam,
		setPermissions,
		sharelinkController.handleRedirect
	);
	publicAppRouter.get(
		'/task',
		csrfMiddleware,
		setParamOrgAndTeam,
		setPermissions,
		taskController.publicGetTaskJson
	);
	server.use('/s/:resourceSlug([a-f0-9]{24})', unauthedMiddlewareChain, publicAppRouter);

	// Airbyte webhooks
	const webhookRouter = Router({ mergeParams: true, caseSensitive: true });
	webhookRouter.use('/sync-successful', airbyteProxyController.handleSuccessfulSyncWebhook);
	webhookRouter.use('/sync-problem', airbyteProxyController.handleProblemWebhook);
	webhookRouter.use('/embed-successful', airbyteProxyController.handleSuccessfulEmbeddingWebhook); //TODO: move these to webhooks controller?
	server.use('/webhook', webhookRouter);

	const teamRouter = Router({ mergeParams: true, caseSensitive: true });

	//airbyte proxy routes
	teamRouter.get('/airbyte/connectors.json', airbyteProxyController.connectorsJson);
	teamRouter.get('/airbyte/specification', airbyteProxyController.specificationJson);
	teamRouter.get('/airbyte/schema', airbyteProxyController.discoverSchemaApi);
	teamRouter.get('/airbyte/jobs', airbyteProxyController.listJobsApi);
	teamRouter.get('/airbyte/connection', airbyteProxyController.checkAirbyteConnection);

	//sessions
	teamRouter.get(
		'/session/:sessionId([a-f0-9]{24})/messages.json',
		sessionController.sessionMessagesJson
	);
	teamRouter.get('/session/:sessionId([a-f0-9]{24}).json', sessionController.sessionJson);
	teamRouter.get(
		'/session/:sessionId([a-f0-9]{24})',
		sessionController.sessionPage.bind(null, app)
	);
	teamRouter.get('/sessions.json', sessionController.sessionsJson);
	teamRouter.post('/forms/session/add', sessionController.addSessionApi);
	teamRouter.delete('/forms/session/:sessionId([a-f0-9]{24})', sessionController.deleteSessionApi);
	teamRouter.post(
		'/forms/session/:sessionId([a-f0-9]{24})/cancel',
		sessionController.cancelSessionApi
	);

	teamRouter.post('/forms/session/:sessionId([a-f0-9]{24})/edit', sessionController.editSessionApi);
	teamRouter.post('/forms/session/:sessionId([a-f0-9]{24})/start', sessionController.startSession);

	//messages
	teamRouter.post(
		'/session/:sessionId([a-f0-9]{24})/send-message',
		sessionController.sendMessage
	);

	//agents
	teamRouter.get('/agents', agentController.agentsPage.bind(null, app));
	teamRouter.get('/agents.json', agentController.agentsJson);
	teamRouter.get(
		'/agent/add',
		hasPerms.one(Permissions.CREATE_AGENT),
		agentController.agentAddPage.bind(null, app)
	);
	teamRouter.get('/agent/:agentId([a-f0-9]{24}).json', agentController.agentJson);
	teamRouter.get(
		'/agent/:agentId([a-f0-9]{24})/edit',
		hasPerms.one(Permissions.EDIT_AGENT),
		agentController.agentEditPage.bind(null, app)
	);
	teamRouter.post(
		'/forms/agent/add',
		hasPerms.one(Permissions.CREATE_AGENT),
		agentController.addAgentApi
	);
	teamRouter.post(
		'/forms/agent/:agentId([a-f0-9]{24})/edit',
		hasPerms.one(Permissions.EDIT_AGENT),
		agentController.editAgentApi
	);
	teamRouter.delete(
		'/forms/agent/:agentId([a-f0-9]{24})',
		hasPerms.one(Permissions.DELETE_AGENT),
		agentController.deleteAgentApi
	);

	//tasks
	teamRouter.get('/tasks', taskController.tasksPage.bind(null, app));
	teamRouter.get('/tasks.json', taskController.tasksJson);
	teamRouter.get(
		'/task/add',
		hasPerms.one(Permissions.CREATE_TASK),
		taskController.taskAddPage.bind(null, app)
	);
	teamRouter.get('/task/:taskId([a-f0-9]{24}).json', taskController.getTaskByIdJson);
	teamRouter.get('/task', taskController.getTaskJson);
	teamRouter.get(
		'/task/:taskId([a-f0-9]{24})/edit',
		hasPerms.one(Permissions.EDIT_TASK),
		taskController.taskEditPage.bind(null, app)
	);
	teamRouter.post(
		'/forms/task/add',
		hasPerms.one(Permissions.CREATE_TASK),
		taskController.addTaskApi
	);
	teamRouter.post(
		'/forms/task/:taskId([a-f0-9]{24})/edit',
		hasPerms.one(Permissions.EDIT_TASK),
		taskController.editTaskApi
	);
	teamRouter.delete(
		'/forms/task/:taskId([a-f0-9]{24})',
		hasPerms.one(Permissions.DELETE_TASK),
		taskController.deleteTaskApi
	);

	//sharelink
	teamRouter.post(
		'/forms/sharelink/add',
		checkSubscriptionPlan([SubscriptionPlan.TEAMS, SubscriptionPlan.ENTERPRISE]),
		sharelinkController.addShareLinkApi
	);

	//apps
	teamRouter.get('/apps', appController.appsPage.bind(null, app));
	teamRouter.get('/apps.json', appController.appsJson);
	teamRouter.get(
		'/app/add',
		hasPerms.one(Permissions.CREATE_APP),
		appController.appAddPage.bind(null, app)
	);
	teamRouter.get('/app/:appId([a-f0-9]{24}).json', appController.appJson);
	teamRouter.get(
		'/app/:appId([a-f0-9]{24})/edit',
		hasPerms.one(Permissions.EDIT_APP),
		appController.appEditPage.bind(null, app)
	);
	teamRouter.post('/forms/app/add', hasPerms.one(Permissions.CREATE_APP), appController.addAppApi);
	teamRouter.post(
		'/forms/app/:appId([a-f0-9]{24})/edit',
		hasPerms.one(Permissions.EDIT_APP),
		appController.editAppApi
	);
	teamRouter.delete(
		'/forms/app/:appId([a-f0-9]{24})',
		hasPerms.one(Permissions.DELETE_APP),
		appController.deleteAppApi
	);

	//tools
	teamRouter.get('/tools', toolController.toolsPage.bind(null, app));
	teamRouter.get('/tools.json', toolController.toolsJson);
	teamRouter.get(
		'/tool/add',
		hasPerms.one(Permissions.CREATE_TOOL),
		toolController.toolAddPage.bind(null, app)
	);
	teamRouter.get('/tool/:toolId([a-f0-9]{24}).json', toolController.toolJson);
	teamRouter.get(
		'/tool/:toolId([a-f0-9]{24})/edit',
		hasPerms.one(Permissions.EDIT_TOOL),
		toolController.toolEditPage.bind(null, app)
	);
	teamRouter.post(
		'/forms/tool/add',
		hasPerms.one(Permissions.CREATE_TOOL),
		fetchUsage,
		// checkSubscriptionBoolean(PlanLimitsKeys.maxFunctionTools),
		toolController.addToolApi
	);
	teamRouter.post(
		'/forms/tool/:toolId([a-f0-9]{24})/edit',
		hasPerms.one(Permissions.EDIT_TOOL),
		fetchUsage,
		// checkSubscriptionBoolean(PlanLimitsKeys.maxFunctionTools),
		toolController.editToolApi
	);
	teamRouter.delete(
		'/forms/tool/:toolId([a-f0-9]{24})',
		hasPerms.one(Permissions.DELETE_TOOL),
		toolController.deleteToolApi
	);

	teamRouter.post(
		'/forms/revision/:revisionId([a-f0-9]{24})/apply',
		hasPerms.one(Permissions.EDIT_TOOL),
		toolController.applyToolRevisionApi
	);
	//TODO: permission for deleting tool revisions
	//TODO: endpoint to download source as zip?
	teamRouter.delete(
		'/forms/revision/:revisionId([a-f0-9]{24})',
		hasPerms.one(Permissions.EDIT_TOOL),
		toolController.deleteToolRevisionApi
	);

	//models
	teamRouter.get('/models', modelController.modelsPage.bind(null, app));
	teamRouter.get('/models.json', modelController.modelsJson);
	teamRouter.get('/model/:modelId([a-f0-9]{24}).json', modelController.modelJson);
	teamRouter.get(
		'/model/add',
		hasPerms.one(Permissions.CREATE_MODEL),
		modelController.modelAddPage.bind(null, app)
	);
	teamRouter.post(
		'/forms/model/add',
		hasPerms.one(Permissions.CREATE_MODEL),
		modelController.modelAddApi
	);
	teamRouter.post(
		'/forms/model/:modelId([a-f0-9]{24})/edit',
		hasPerms.one(Permissions.EDIT_MODEL),
		modelController.editModelApi
	);
	teamRouter.delete(
		'/forms/model/:modelId([a-f0-9]{24})',
		hasPerms.one(Permissions.DELETE_MODEL),
		modelController.deleteModelApi
	);

	//datasources
	teamRouter.get('/datasources', datasourceController.datasourcesPage.bind(null, app));
	teamRouter.get('/connections', datasourceController.connectionsPage.bind(null, app));
	teamRouter.get('/datasources.json', datasourceController.datasourcesJson);
	teamRouter.get(
		'/datasource/add',
		hasPerms.one(Permissions.CREATE_DATASOURCE),
		datasourceController.datasourceAddPage.bind(null, app)
	);
	teamRouter.get(
		'/datasource/:datasourceId([a-f0-9]{24}).json',
		datasourceController.datasourceJson
	);

	teamRouter.get(
		'/connections/:datasourceId([a-f0-9]{24}).json',
		datasourceController.datasourceJson
	);
	teamRouter.get(
		'/datasource/:datasourceId([a-f0-9]{24})/edit',
		hasPerms.one(Permissions.EDIT_DATASOURCE),
		datasourceController.datasourceEditPage.bind(null, app)
	);
	teamRouter.post(
		'/forms/datasource/upload',
		hasPerms.one(Permissions.CREATE_DATASOURCE),
		datasourceController.uploadFileApi
	);
	teamRouter.post(
		'/forms/datasource/test',
		hasPerms.one(Permissions.CREATE_DATASOURCE),
		fetchUsage,
		checkSubscriptionBoolean(PlanLimitsKeys.dataConnections),
		datasourceController.testDatasourceApi
	);
	teamRouter.post(
		'/forms/datasource/add',
		hasPerms.one(Permissions.CREATE_DATASOURCE),
		fetchUsage,
		checkSubscriptionBoolean(PlanLimitsKeys.dataConnections),
		datasourceController.addDatasourceApi
	);
	teamRouter.patch(
		'/forms/datasource/:datasourceId([a-f0-9]{24})/streams',
		hasPerms.one(Permissions.EDIT_DATASOURCE),
		datasourceController.updateDatasourceStreamsApi
	);
	teamRouter.patch(
		'/forms/datasource/:datasourceId([a-f0-9]{24})/schedule',
		hasPerms.one(Permissions.EDIT_DATASOURCE),
		datasourceController.updateDatasourceScheduleApi
	);
	teamRouter.post(
		'/forms/datasource/:datasourceId([a-f0-9]{24})/sync',
		hasPerms.one(Permissions.SYNC_DATASOURCE),
		datasourceController.syncDatasourceApi
	);
	teamRouter.delete(
		'/forms/datasource/:datasourceId([a-f0-9]{24})',
		hasPerms.one(Permissions.DELETE_DATASOURCE),
		datasourceController.deleteDatasourceApi
	);

	//onboarding
	teamRouter.get('/onboarding', accountController.onboardingPage.bind(null, app));
	teamRouter.get(
		'/onboarding/configuremodels',
		accountController.configureModelsPage.bind(null, app)
	);

	//team
	teamRouter.get('/team', teamController.teamPage.bind(null, app));
	teamRouter.get('/team.json', teamController.teamJson);
	teamRouter.get('/team/vectorstorage.json', teamController.vectorStorageJson);
	teamRouter.get('/team/models.json', teamController.teamModelsJson);
	teamRouter.get(
		'/team/:memberId([a-f0-9]{24}).json',
		hasPerms.one(Permissions.EDIT_TEAM_MEMBER),
		teamController.teamMemberJson
	);
	teamRouter.get(
		'/team/:memberId([a-f0-9]{24})/edit',
		hasPerms.one(Permissions.EDIT_TEAM_MEMBER),
		teamController.memberEditPage.bind(null, app)
	);
	teamRouter.post(
		'/forms/team/:memberId([a-f0-9]{24})/edit',
		hasPerms.one(Permissions.EDIT_TEAM_MEMBER),
		teamController.editTeamMemberApi
	);
	teamRouter.post(
		'/forms/team/edit',
		hasPerms.one(Permissions.EDIT_TEAM),
		teamController.editTeamApi
	);
	teamRouter.post(
		'/forms/team/invite',
		hasPerms.one(Permissions.ADD_TEAM_MEMBER),
		checkSubscriptionPlan([SubscriptionPlan.TEAMS, SubscriptionPlan.ENTERPRISE]),
		fetchUsage,
		checkSubscriptionLimit(PlanLimitsKeys.users),
		teamController.inviteTeamMemberApi
	);
	teamRouter.delete(
		'/forms/team/invite', //TODO: change to be a :memberId route for delete, duh
		hasPerms.one(Permissions.REMOVE_TEAM_MEMBER),
		checkSubscriptionPlan([SubscriptionPlan.TEAMS, SubscriptionPlan.ENTERPRISE]),
		teamController.deleteTeamMemberApi
	);
	// teamRouter.post(
	// 	'/forms/team/transfer-ownership',
	// 	hasPerms.any(Permissions.ORG_OWNER, Permissions.TEAM_OWNER),
	// 	teamController.transferTeamOwnershipApi
	// );
	teamRouter.post(
		'/forms/team/add',
		hasPerms.one(Permissions.CREATE_TEAM),
		checkSubscriptionPlan([SubscriptionPlan.TEAMS, SubscriptionPlan.ENTERPRISE]),
		teamController.addTeamApi
	);
	teamRouter.post(
		'/forms/team/set-default-model',
		hasPerms.one(Permissions.CREATE_MODEL),
		teamController.setDefaultModelApi
	);

	//org
	teamRouter.get('/org', orgController.orgPage.bind(null, app));
	teamRouter.get('/org.json', orgController.orgJson);
	teamRouter.post('/forms/org/edit', hasPerms.one(Permissions.EDIT_ORG), orgController.editOrgApi);
	teamRouter.get('/org/teamvectorusage.json', orgController.vectorStorageAllTeams);
	teamRouter.get(
		'/org/:memberId([a-f0-9]{24}).json',
		hasPerms.one(Permissions.EDIT_ORG_MEMBER),
		orgController.orgMemberJson
	);
	teamRouter.get(
		'/org/:memberId([a-f0-9]{24})/edit',
		hasPerms.one(Permissions.EDIT_ORG_MEMBER),
		orgController.memberEditPage.bind(null, app)
	);
	teamRouter.post(
		'/forms/org/:memberId([a-f0-9]{24})/edit',
		hasPerms.one(Permissions.EDIT_TEAM_MEMBER),
		orgController.editOrgMemberApi
	);
	teamRouter.delete(
		'/forms/org/invite', //TODO: change to be a :memberId route for delete, duh
		hasPerms.one(Permissions.REMOVE_ORG_MEMBER),
		checkSubscriptionPlan([SubscriptionPlan.TEAMS, SubscriptionPlan.ENTERPRISE]),
		orgController.deleteOrgMemberApi
	);

	//assets
	// teamRouter.get('/assets', hasPerms.one(Permissions.UPLOAD_ASSET), assetController.assetPage.bind(null, app));
	// teamRouter.get('/asset/add', hasPerms.one(Permissions.UPLOAD_ASSET), assetController.assetAddPage.bind(null, app));
	teamRouter.post(
		'/forms/asset/add',
		hasPerms.one(Permissions.UPLOAD_ASSET),
		assetController.uploadAssetApi
	);
	// teamRouter.get('/asset/:assetId([a-f0-9]{24}).json', authedMiddlewareChain, assetController.getAsset);
	// teamRouter.post('/asset/:assetId([a-f0-9]{24})/edit', authedMiddlewareChain, assetController.editAsset);
	// teamRouter.delete('/forms/asset/:assetId([a-f0-9]{24})', authedMiddlewareChain, assetController.deleteAsset);

	//notifications
	teamRouter.get('/notifications.json', notificationController.notificationsJson);
	teamRouter.patch('/forms/notification/seen', notificationController.markNotificationsSeenApi);

	teamRouter.get('/variables.json', variableController.variablesJson);

	teamRouter.get('/variable/:variableId([a-f0-9]{24}).json', variableController.variableJson);

	teamRouter.get(
		'/variable/:variableId/edit',
		hasPerms.one(Permissions.EDIT_VARIABLE),
		variableController.variableEditPage.bind(null, app)
	);

	teamRouter.post(
		'/forms/variable/add',
		hasPerms.one(Permissions.CREATE_VARIABLE),
		variableController.addVariableApi
	);
	teamRouter.post(
		'/forms/variable/:variableId/edit',
		hasPerms.one(Permissions.EDIT_VARIABLE),
		variableController.editVariableApi
	);
	teamRouter.delete(
		'/forms/variable/:variableId',
		hasPerms.one(Permissions.DELETE_VARIABLE),
		variableController.deleteVariableApi
	);

	teamRouter.get('/vectordbs.json', vectorDbController.vectorDbsJson);

	teamRouter.get('/vectordb/:vectorDbId([a-f0-9]{24}).json', vectorDbController.vectorDbJson);

	teamRouter.get(
		'/vectordb/:vectorDbId/edit',
		hasPerms.one(Permissions.EDIT_VECTOR_DB),
		vectorDbController.vectorDbEditPage.bind(null, app)
	);

	teamRouter.post(
		'/forms/vectordb/add',
		hasPerms.one(Permissions.CREATE_VECTOR_DB),
		vectorDbController.addVectorDbApi
	);
	teamRouter.post(
		'/forms/vectordb/:vectorDbId/edit',
		hasPerms.one(Permissions.EDIT_VECTOR_DB),
		vectorDbController.editVectorDbApi
	);
	teamRouter.delete(
		'/forms/vectordb/:vectorDbId',
		hasPerms.one(Permissions.DELETE_VECTOR_DB),
		vectorDbController.deleteVectorDbApi
	);

	server.use(
		'/:resourceSlug([a-f0-9]{24})',
		authedMiddlewareChain,
		checkResourceSlug,
		setSubscriptionLocals,
		setPermissions,
		teamRouter
	);
}
