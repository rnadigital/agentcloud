import NProgress from 'nprogress';
import { GetTaskByNameDispatch, GetTeamModelsDispatch, GetVariableDispatch, GetVectorDbDispatch } from 'struct/dispatchtypes';

// Account
export function getAccount(body, dispatch, errorCallback, router) {
	const queryString = new URLSearchParams({
		...(body?.memberId ? { memberId: body.memberId } : {}),
		...(body?.resourceSlug ? { resourceSlug: body.resourceSlug } : {})
	}).toString();
	return ApiCall(`/account.json?${queryString}`, 'GET', null, dispatch, errorCallback, router);
} 
export function login(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/account/login', 'POST', body, dispatch, errorCallback, router);
}
export function register(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/account/register', 'POST', body, dispatch, errorCallback, router);
}
export function requestChangePassword(body, dispatch, errorCallback, router) {
	return ApiCall(
		'/forms/account/requestchangepassword',
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
} 
export function logout(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/account/logout', 'POST', body, dispatch, errorCallback, router);
}
export function changePassword(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/account/changepassword', 'POST', body, dispatch, errorCallback, router);
}
export function verifyToken(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/account/verify', 'POST', body, dispatch, errorCallback, router);
}
export function switchTeam(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/account/switch', 'POST', body, dispatch, errorCallback, router);
}//@TEST
export function getPortalLink(body, dispatch, errorCallback, router) {
	return ApiCall('/stripe-portallink', 'POST', body, dispatch, errorCallback, router);
}
export function requestChangePlan(body, dispatch, errorCallback, router) {
	return ApiCall('/stripe-plan', 'POST', body, dispatch, errorCallback, router);
}
export function confirmChangePlan(body, dispatch, errorCallback, router) {
	return ApiCall('/stripe-plan-confirm', 'POST', body, dispatch, errorCallback, router);
}
export function hasPaymentMethod(dispatch, errorCallback, router) {
	return ApiCall('/stripe-has-paymentmethod', 'GET', null, dispatch, errorCallback, router);
}
export function checkStripeReady(dispatch, errorCallback, router) {
	return ApiCall('/stripe-ready', 'GET', null, dispatch, errorCallback, router);
}
export function updateOnboardedStatus(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/account/onboarded', 'POST', body, dispatch, errorCallback, router);
}

export function updateRole(body, dispatch, errorCallback, router) {
	const queryString = new URLSearchParams({ resourceSlug: body?.resourceSlug });
	return ApiCall(
		`/forms/account/role?${queryString}`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}

export function markOnboarded(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/forms/account/onboard`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}


//Welcome
export function getWelcomeData(dispatch, errorCallback, router){
	return ApiCall(`/welcome.json`, 'GET', null, dispatch, errorCallback, router);
}

// Sharelinks
export function createShareLink(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/sharelink/add`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
} //@TEST

// Apps
export function getApps(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/apps.json`, 'GET', null, dispatch, errorCallback, router);
} //@TEST
export function getApp(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/app/${body.appId}.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
} //@TEST
export function editApp(appId, body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/app/${appId}/edit`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
} //@TEST
export function publicStartApp(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/s/${body.resourceSlug}/forms/app/${body.id}/start`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
} //@TEST

export function addApp(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/app/add`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
} //@TEST
export function deleteApp(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/app/${body.appId}`,
		'DELETE',
		body,
		dispatch,
		errorCallback,
		router
	);
} //@TEST

// Sessions
export function getSession(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/session/${body.sessionId}.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
} //@TEST
export function deleteSession(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/session/${body.sessionId}`,
		'DELETE',
		body,
		dispatch,
		errorCallback,
		router
	);
} //@TEST
export function cancelSession(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/session/${body.sessionId}/cancel`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
} //@TEST
export function addSession(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/session/add`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
} //@TEST
export function getSessions(body, dispatch, errorCallback, router) {
	const queryString = new URLSearchParams({ before: body?.before });
	return ApiCall(
		`/${body.resourceSlug}/sessions.json?${queryString.toString()}`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}

export function publicUpdateSession(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/session/${body.sessionId}/edit`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}

export function publicStartSession(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/session/${body.sessionId}/start`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}

export function updateSession(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/session/${body.sessionId}/edit`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}

export function startSession(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/session/${body.sessionId}/start`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}


export function getMessages(body, dispatch, errorCallback, router) {
	const queryString = new URLSearchParams({
		...(body?.messageId ? { messageId: body.messageId } : {})
	}).toString();
	return ApiCall(`/${body.resourceSlug}/session/${body.sessionId}/messages.json?${queryString}`, 'GET', null, dispatch, errorCallback, router);
} //@TEST


// Agents
export function addAgent(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/agent/add`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
} //@TEST
export function editAgent(agentId, body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/agent/${agentId}/edit`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function getAgent(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/agent/${body.agentId}.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function getAgents(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/agents.json`, 'GET', null, dispatch, errorCallback, router);
}//@TEST
export function deleteAgent(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/agent/${body.agentId}`,
		'DELETE',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST

//APIKeys

export function addKey(body, dispatch, errorCallback, router){
	return ApiCall(
		'/forms/account/apikey/add',
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	)
}//@TEST

export function getKeys(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/apikeys.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function getKey(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/apikey/${body.keyId}.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router	
	);
}//@TEST

export function incrementKeyVersion(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/forms/account/apikey/${body.keyId}/increment`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST

export function deleteKey(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/forms/account/apikey/${body.keyId}`,
		'DELETE',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST

// Tasks
export function getTasks(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/tasks.json`, 'GET', null, dispatch, errorCallback, router);
}
export function getTaskById(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/task/${body.taskId}.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function getTask(body, dispatch: GetTaskByNameDispatch, errorCallback, router) {
	const queryString = new URLSearchParams({
		...(body.name ? { name: body.name } : {}),
		...(body.sessionId ? { sessionId: body.sessionId } : {}), //could go in params but whatever
	});
	return ApiCall(
		`/${body.resourceSlug}/task?${queryString}`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST

export function addTask(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/task/add`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function deleteTask(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/task/${body.taskId}`,
		'DELETE',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function editTask(taskId, body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/task/${taskId}/edit`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST

// Tools
export function getTools(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/tools.json`, 'GET', null, dispatch, errorCallback, router);
}//@TEST
export function getTool(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/tool/${body.toolId}.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function addTool(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/tool/add`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function deleteTool(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/tool/${body.toolId}`,
		'DELETE',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function editTool(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/tool/${body.toolId}/edit`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function applyToolRevision(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/revision/${body.revisionId}/apply`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function deleteToolRevision(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/revision/${body.revisionId}`,
		'DELETE',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST

// Models
export function getModels(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/models.json`, 'GET', null, dispatch, errorCallback, router);
}//@TEST
export function getModel(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/model/${body.modelId}.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function addModel(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/model/add`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function editModel(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/model/${body.modelId}/edit`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function deleteModel(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/model/${body.modelId}`,
		'DELETE',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST

// Asset
export function addAsset(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.get('resourceSlug')}/forms/asset/add`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function getAsset(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/asset/${body.assetId}.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function editAsset(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/asset/${body.assetId}/edit`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function deleteAsset(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/asset/${body.assetId}`,
		'DELETE',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST

// Datasources
export function getDatasources(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/datasources.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function getDatasource(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/datasource/${body.datasourceId}.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function testDatasource(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/datasource/test`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function addDatasource(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/datasource/add`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function updateDatasourceStreams(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/datasource/${body.datasourceId}/streams`,
		'PATCH',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function updateDatasourceSchedule(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/datasource/${body.datasourceId}/schedule`,
		'PATCH',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function deleteDatasource(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/datasource/${body.datasourceId}`,
		'DELETE',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function editDatasource(datasourceId, body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/datasource/${datasourceId}/edit`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function syncDatasource(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/datasource/${body.datasourceId}/sync`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST

// Airbyte
export function getConnectors(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/airbyte/connectors.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}
export function getSpecification(body, dispatch, errorCallback, router) {
	const queryString = new URLSearchParams({
		sourceDefinitionId: body.sourceDefinitionId
	}).toString();
	return ApiCall(
		`/${body.resourceSlug}/airbyte/specification?${queryString}`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function getJobsList(body, dispatch, errorCallback, router) {
	const queryString = new URLSearchParams({
		datasourceId: body.datasourceId
	}).toString();
	return ApiCall(
		`/${body.resourceSlug}/airbyte/jobs?${queryString}`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function getDatasourceSchema(body, dispatch, errorCallback, router) {
	const queryString = new URLSearchParams({
		datasourceId: body.datasourceId
	}).toString();
	return ApiCall(
		`/${body.resourceSlug}/airbyte/schema?${queryString}`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST

export function checkAirbyteConnection(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/airbyte/connection`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}

//Temp datasource stuff
export function uploadDatasourceFileTemp(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.get('resourceSlug')}/forms/datasource/upload`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST

//Team (invites/members/etc)
export function getNotifications(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/notifications.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function markNotificationsSeen(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/notification/seen`,
		'PATCH',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function getTeam(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/team.json`, 'GET', null, dispatch, errorCallback, router);
}//@TEST
export function getTeamMember(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/team/${body.memberId}.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function inviteToTeam(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/team/invite`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function deleteFromTeam(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/team/invite`,
		'DELETE',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function addTeam(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/team/add`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function editTeamMember(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.get('resourceSlug')}/forms/team/${body.get('memberId')}/edit`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function deleteTeamMember(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/team/invite`,
		'DELETE',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function editTeam(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/team/edit`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function transferTeamOwnership(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/team/transfer-ownership`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function setDefaultModel(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/team/set-default-model`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function getTeamModels(body, dispatch: GetTeamModelsDispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/team/models.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST

//get the vector storage usage on a team basis
export function getVectorStorageTeam(body, dispatch, errorCallback, router){
	return ApiCall(
		`/${body.resourceSlug}/team/vectorstorage.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	)
}

export function getOrg(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/org.json`, 'GET', null, dispatch, errorCallback, router);
}//@TEST

export function getAllTeamVectorStorage(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/org/teamvectorusage.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	)
}
export function editOrg(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/org/edit`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function getOrgMember(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/org/${body.memberId}.json`,
		'GET',
		null,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function editOrgMember(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.get('resourceSlug')}/forms/org/${body.get('memberId')}/edit`,
		'POST',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST
export function deleteOrgMember(body, dispatch, errorCallback, router) {
	return ApiCall(
		`/${body.resourceSlug}/forms/org/invite`,
		'DELETE',
		body,
		dispatch,
		errorCallback,
		router
	);
}//@TEST

export function getVariables(body, dispatch, errorCallback, router) {
    return ApiCall(`/${body.resourceSlug}/variables.json`, 'GET', null, dispatch, errorCallback, router);
}

export function getVariable(body, dispatch:GetVariableDispatch, errorCallback, router) {
    return ApiCall(`/${body.resourceSlug}/variable/${body.variableId}.json`, 'GET', null, dispatch, errorCallback, router);
}

export function addVariable(body, dispatch, errorCallback, router) {
    return ApiCall(`/${body.resourceSlug}/forms/variable/add`, 'POST', body, dispatch, errorCallback, router);
}

export function updateVariable(body, dispatch , errorCallback, router) {
    return ApiCall(`/${body.resourceSlug}/forms/variable/${body.variableId}/edit`, 'POST', body, dispatch, errorCallback, router);
}

export function deleteVariable(body, dispatch, errorCallback, router) {
    return ApiCall(`/${body.resourceSlug}/forms/variable/${body.variableId}`, 'DELETE', body, dispatch, errorCallback, router);
}

export function getVectorDbs(body, dispatch, errorCallback, router) {
    return ApiCall(`/${body.resourceSlug}/vectordbs.json`, 'GET', null, dispatch, errorCallback, router);
}

export function getVectorDb(body, dispatch:GetVectorDbDispatch, errorCallback, router) {
    return ApiCall(`/${body.resourceSlug}/vectordb/${body.vectorDbId}.json`, 'GET', null, dispatch, errorCallback, router);
}

export function addVectorDb(body, dispatch, errorCallback, router) {
    return ApiCall(`/${body.resourceSlug}/forms/vectordb/add`, 'POST', body, dispatch, errorCallback, router);
}

export function updateVectorDb(body, dispatch , errorCallback, router) {
    return ApiCall(`/${body.resourceSlug}/forms/vectordb/${body.vectorDbId}/edit`, 'POST', body, dispatch, errorCallback, router);
}

export function deleteVectorDb(body, dispatch, errorCallback, router) {
    return ApiCall(`/${body.resourceSlug}/forms/vectordb/${body.vectorDbId}`, 'DELETE', body, dispatch, errorCallback, router);
}

function buildOptions(_route, method, body) {
	// Convert method uppercase
	method = method.toUpperCase();
	const options: any = {
		redirect: 'manual',
		method,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${localStorage.getItem('_jwt') || ''}`
		}
	};
	if (body != null) {
		if(method === "GET"){
			throw new Error("GET request can't have body");
		}
		//TODO: remove/change
		if (body instanceof FormData) {
			//formdata upload for files
			return {
				redirect: 'manual',
				method,
				headers: {
					Authorization: `Bearer ${localStorage.getItem('_jwt') || ''}`
				},
				body
			};
		}

		options.body = JSON.stringify(body);
	}

	//TODO: for GETs, use "body" with URLSearchParams and append as url query
	return options;
}

export async function ApiCall(
	route,
	method = 'get',
	body,
	dispatch,
	errorCallback,
	router,
	finishProgress = 1
) {
	// Start progress bar
	NProgress.inc();

	// Build request options for fetch
	const requestOptions = buildOptions(route, method, body);

	// Make request, catch errors, and finally{} to always end progress bar
	let response;
	try {
		if (location && location.pathname.startsWith('/s/') && !route.startsWith('/s/')) {
			route = `/s${route}`;
		}
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
			router && router.push(response.redirect, null, { scroll: false }).catch(err => console.warn); //gracefully fail on navigation to same URL
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
