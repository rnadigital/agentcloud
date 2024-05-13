import NProgress from 'nprogress';

// Account
export function getAccount(body, dispatch, errorCallback, router) {
	const queryString = new URLSearchParams({
		...(body?.memberId ? { memberId: body.memberId } : {}),
		...(body?.resourceSlug ? { resourceSlug: body.resourceSlug } : {}),
	}).toString();
	return ApiCall(`/account.json?${queryString}`, 'GET', null, dispatch, errorCallback, router);
}
export function getDockerLogs(dispatch, errorCallback, router) {
	return ApiCall('/logs.json', 'GET', null, dispatch, errorCallback, router);
}
export function login(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/account/login', 'POST', body, dispatch, errorCallback, router);
}
export function register(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/account/register', 'POST', body, dispatch, errorCallback, router);
}
export function requestChangePassword(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/account/requestchangepassword', 'POST', body, dispatch, errorCallback, router);
}
export function changePassword(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/account/changepassword', 'POST', body, dispatch, errorCallback, router);
}
export function verifyToken(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/account/verify', 'POST', body, dispatch, errorCallback, router);
}
export function switchTeam(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/account/switch', 'POST', body, dispatch, errorCallback, router);
}
export function getPaymentLink(body, dispatch, errorCallback, router) {
	return ApiCall('/stripe-paymentlink', 'POST', body, dispatch, errorCallback, router);
}
export function getPortalLink(body, dispatch, errorCallback, router) {
	return ApiCall('/stripe-portallink', 'POST', body, dispatch, errorCallback, router);
}
export function changePlan(body, dispatch, errorCallback, router) {
	return ApiCall('/stripe-plan', 'POST', body, dispatch, errorCallback, router);
}
export function createPortalSession(body, dispatch, errorCallback, router) {
	return ApiCall('/stripe-portal', 'POST', body, dispatch, errorCallback, router);
}
export function adminEditAccount(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/account/admin', 'POST', body, dispatch, errorCallback, router);
}

// Apps
export function getApps(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/apps.json`, 'GET', null, dispatch, errorCallback, router);
}
export function getApp(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/app/${body.appId}.json`, 'GET', null, dispatch, errorCallback, router);
}
export function editApp(appId, body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/app/${appId}/edit`, 'POST', body, dispatch, errorCallback, router);
}
export function addApp(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/app/add`, 'POST', body, dispatch, errorCallback, router);
}
export function deleteApp(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/app/${body.appId}`, 'DELETE', body, dispatch, errorCallback, router);
}

// Sessions
export function getSession(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/session/${body.sessionId}.json`, 'GET', null, dispatch, errorCallback, router);
}
export function deleteSession(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/session/${body.sessionId}`, 'DELETE', body, dispatch, errorCallback, router);
}
export function cancelSession(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/session/${body.sessionId}/cancel`, 'POST', body, dispatch, errorCallback, router);
}
export function addSession(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/session/add`, 'POST', body, dispatch, errorCallback, router);
}
export function getSessions(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/sessions.json`, 'GET', null, dispatch, errorCallback, router);
}
export function getMessages(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/session/${body.sessionId}/messages.json`, 'GET', null, dispatch, errorCallback, router);
}

// Agents
export function addAgent(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/agent/add`, 'POST', body, dispatch, errorCallback, router);
}
export function editAgent(agentId, body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/agent/${agentId}/edit`, 'POST', body, dispatch, errorCallback, router);
}
export function getAgent(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/agent/${body.agentId}.json`, 'GET', null, dispatch, errorCallback, router);
}
export function getAgents(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/agents.json`, 'GET', null, dispatch, errorCallback, router);
}
export function deleteAgent(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/agent/${body.agentId}`, 'DELETE', body, dispatch, errorCallback, router);
}

// Tasks
export function getTasks(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/tasks.json`, 'GET', null, dispatch, errorCallback, router);
}
export function getTask(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/task/${body.taskId}.json`, 'GET', null, dispatch, errorCallback, router);
}
export function addTask(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/task/add`, 'POST', body, dispatch, errorCallback, router);
}
export function deleteTask(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/task/${body.taskId}`, 'DELETE', body, dispatch, errorCallback, router);
}
export function editTask(taskId, body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/task/${taskId}/edit`, 'POST', body, dispatch, errorCallback, router);
}

// Tools
export function getTools(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/tools.json`, 'GET', null, dispatch, errorCallback, router);
}
export function getTool(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/tool/${body.toolId}.json`, 'GET', null, dispatch, errorCallback, router);
}
export function addTool(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/tool/add`, 'POST', body, dispatch, errorCallback, router);
}
export function deleteTool(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/tool/${body.toolId}`, 'DELETE', body, dispatch, errorCallback, router);
}
export function editTool(toolId, body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/tool/${toolId}/edit`, 'POST', body, dispatch, errorCallback, router);
}

// Models
export function getModels(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/models.json`, 'GET', null, dispatch, errorCallback, router);
}
export function getModel(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/model/${body.modelId}.json`, 'GET', null, dispatch, errorCallback, router);
}
export function addModel(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/model/add`, 'POST', body, dispatch, errorCallback, router);
}
export function editModel(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/model/${body.modelId}/edit`, 'POST', body, dispatch, errorCallback, router);
}
export function deleteModel(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/model/${body.modelId}`, 'DELETE', body, dispatch, errorCallback, router);
}

// Asset
export function addAsset(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.get('resourceSlug')}/forms/asset/add`, 'POST', body, dispatch, errorCallback, router);
}
export function getAsset(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/asset/${body.assetId}.json`, 'GET', null, dispatch, errorCallback, router);
}
export function editAsset(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/asset/${body.assetId}/edit`, 'POST', body, dispatch, errorCallback, router);
}
export function deleteAsset(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/asset/${body.assetId}`, 'DELETE', body, dispatch, errorCallback, router);
}

// Credentials
export function getCredentials(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/credentials.json`, 'GET', null, dispatch, errorCallback, router);
}
export function deleteCredential(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/credential/${body.credentialId}`, 'DELETE', body, dispatch, errorCallback, router);
}
export function addCredential(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/credential/add`, 'POST', body, dispatch, errorCallback, router);
}

// Datasources
export function getDatasources(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/datasources.json`, 'GET', null, dispatch, errorCallback, router);
}
export function getDatasource(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/datasource/${body.datasourceId}.json`, 'GET', null, dispatch, errorCallback, router);
}
export function testDatasource(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/datasource/test`, 'POST', body, dispatch, errorCallback, router);
}
export function addDatasource(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/datasource/add`, 'POST', body, dispatch, errorCallback, router);
}
export function updateDatasourceStreams(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/datasource/${body.datasourceId}/streams`, 'PATCH', body, dispatch, errorCallback, router);
}
export function updateDatasourceSchedule(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/datasource/${body.datasourceId}/schedule`, 'PATCH', body, dispatch, errorCallback, router);
}
export function deleteDatasource(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/datasource/${body.datasourceId}`, 'DELETE', body, dispatch, errorCallback, router);
}
export function editDatasource(datasourceId, body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/datasource/${datasourceId}/edit`, 'POST', body, dispatch, errorCallback, router);
}
export function syncDatasource(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/datasource/${body.datasourceId}/sync`, 'POST', body, dispatch, errorCallback, router);
}

// Airbyte
export function getSpecification(body, dispatch, errorCallback, router) {
	const queryString = new URLSearchParams({
		sourceDefinitionId: body.sourceDefinitionId,
	}).toString();
	return ApiCall(`/${body.resourceSlug}/airbyte/specification?${queryString}`, 'GET', null, dispatch, errorCallback, router);
}
export function getJobsList(body, dispatch, errorCallback, router) {
	const queryString = new URLSearchParams({
		datasourceId: body.datasourceId,
	}).toString();
	return ApiCall(`/${body.resourceSlug}/airbyte/jobs?${queryString}`, 'GET', null, dispatch, errorCallback, router);
}
export function getDatasourceSchema(body, dispatch, errorCallback, router) {
	const queryString = new URLSearchParams({
		datasourceId: body.datasourceId,
	}).toString();
	return ApiCall(`/${body.resourceSlug}/airbyte/schema?${queryString}`, 'GET', null, dispatch, errorCallback, router);
}

//Temp datasource stuff
export function uploadDatasourceFileTemp(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.get('resourceSlug')}/forms/datasource/upload`, 'POST', body, dispatch, errorCallback, router);
}

//Team (invites/members/etc)
export function getNotifications(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/notifications.json`, 'GET', null, dispatch, errorCallback, router);
}
export function markNotificationsSeen(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/notification/seen`, 'PATCH', body, dispatch, errorCallback, router);
}
export function getTeam(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/team.json`, 'GET', null, dispatch, errorCallback, router);
}
export function getTeamMember(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/team/${body.memberId}.json`, 'GET', null, dispatch, errorCallback, router);
}
export function inviteToTeam(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/team/invite`, 'POST', body, dispatch, errorCallback, router);
}
export function deleteFromTeam(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/team/invite`, 'DELETE', body, dispatch, errorCallback, router);
}
export function addTeam(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/team/add`, 'POST', body, dispatch, errorCallback, router);
}
export function editTeamMember(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.get('resourceSlug')}/forms/team/${body.get('memberId')}/edit`, 'POST', body, dispatch, errorCallback, router);
}

function buildOptions(_route, method, body) {

	// Convert method uppercase
	method = method.toUpperCase();
	const options: any = {
		redirect: 'manual',
		method,
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${localStorage.getItem('_jwt') || ''}`
		}
	};
	if (body != null) {

		//TODO: remove/change
		if (body instanceof FormData) {
			//formdata upload for files
			return {
				redirect: 'manual',
				method,
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('_jwt') || ''}`
				},
				body,
			};
		}
	
		options.body = JSON.stringify(body);
	}

	//TODO: for GETs, use "body" with URLSearchParams and append as url query
	return options;

}

export async function ApiCall(route, method='get', body, dispatch, errorCallback, router, finishProgress=1) {

	// Start progress bar
	NProgress.inc();

	// Build request options for fetch
	const requestOptions = buildOptions(route, method, body);

	// Make request, catch errors, and finally{} to always end progress bar
	let response;
	try {
		response = await fetch(route, requestOptions);
	} catch (e) {
		console.error(e);
	} finally {
		if (finishProgress != null) {
			NProgress.set(finishProgress);
		} else {
			NProgress.done(true);
		}
	}

	// Show a generic error if we don't get any response at all
	if (!response) {
		errorCallback && errorCallback('An unexpected error occurred, please contact support.');
		NProgress.done(true);
		return;
	}

	// Process request response
	const contentType = response.headers.get('Content-type');
	if (!contentType) {
		errorCallback && errorCallback('An error occurred');
		NProgress.done(true);
		return;
	}
	if (contentType.startsWith('application/json;')) {
		response = await response.json();
		if (response.token) {
			localStorage.setItem('_jwt', response.token);
		}
		if (response.redirect) {
			router && router.push(response.redirect, null, { scroll: false })
				.catch(err => console.warn); //gracefully fail on navigation to same URL
			return response;
		} else if (response.error) {
			errorCallback && errorCallback(response.error);
			return;
		}
		dispatch && dispatch(response);
		return response;
	} else {
		errorCallback && errorCallback('An error occurred');
		NProgress.done(true);
	}

}
