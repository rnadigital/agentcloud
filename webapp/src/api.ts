
import NProgress from 'nprogress';

// Account
export function getAccount(dispatch, errorCallback, router) {
	return ApiCall('/account.json', 'GET', null, dispatch, errorCallback, router);
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

// Sessions
export function getSession(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/session/${body.sessionId}.json`, 'GET', null, dispatch, errorCallback, router);
}
export function deleteSession(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/session/${body.sessionId}`, 'DELETE', body, dispatch, errorCallback, router);
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

// Groups
export function getGroup(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/group/${body.groupId}.json`, 'GET', null, dispatch, errorCallback, router);
}
export function addGroup(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/group/add`, 'POST', body, dispatch, errorCallback, router);
}
export function editGroup(groupId, body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/group/${groupId}/edit`, 'POST', body, dispatch, errorCallback, router);
}
export function deleteGroup(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/group/${body.groupId}`, 'DELETE', body, dispatch, errorCallback, router);
}
export function getGroups(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/groups.json`, 'GET', null, dispatch, errorCallback, router);
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

// Datasources
export function getDatasources(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/datasources.json`, 'GET', null, dispatch, errorCallback, router);
}
export function getDatasource(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/datasource/${body.datasourceId}.json`, 'GET', null, dispatch, errorCallback, router);
}
export function addDatasource(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/datasource/add`, 'POST', body, dispatch, errorCallback, router);
}
export function deleteDatasource(body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/datasource/${body.datasourceId}`, 'DELETE', body, dispatch, errorCallback, router);
}
export function editDatasource(datasourceId, body, dispatch, errorCallback, router) {
	return ApiCall(`/${body.resourceSlug}/forms/datasource/${datasourceId}/edit`, 'POST', body, dispatch, errorCallback, router);
}

// Airbyte
export function getSpecification(body, dispatch, errorCallback, router) {
	const queryString = new URLSearchParams({
		sourceDefinitionId: body.sourceDefinitionId,
	}).toString();
	return ApiCall(`/${body.resourceSlug}/airbyte/specification?${queryString}`, 'GET', null, dispatch, errorCallback, router);
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
		options.body = JSON.stringify(body);
	}

	//TODO: for GETs, use "body" with URLSearchParams and append as url query
	return options;

}

export async function ApiCall(route, method='get', body, dispatch, errorCallback, router, finishProgress=1) {

	// Start progress bar
	NProgress.start();

	// Build request options for fetch
	const requestOptions = buildOptions(route, method, body);

	// Make request, catch errors, and finally{} to always end progress bar
	let response;
	try {
		response = await fetch(route, requestOptions);
	} catch(e) {
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
		dispatch(response);
		return response;
	} else {
		errorCallback && errorCallback('An error occurred');
		NProgress.done(true);
	}

}
