import { getSessionData } from './account';

export enum fetchTypes {
	POST = 'POST',
	GET = 'GET',
	DELETE = 'DELETE'
}

export async function getInitialData() {
	const initialData = getSessionData();
	const sessionCookie = initialData?.sessionCookie;
	const resourceSlug = initialData?.accountData?.account?.currentTeam;
	const csrfToken = initialData?.accountData?.csrf;

	return { initialData, sessionCookie, resourceSlug, csrfToken };
}

export async function makeFetch(URL: string, type: fetchTypes, body?: any) {
	const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData();
	return await fetch(URL, {
		method: type,
		headers: {
			cookie: sessionCookie,
			...(type === fetchTypes.POST ? { 'content-type': 'application/json' } : {})
		},
		...(body ? { body: JSON.stringify({ ...body, _csrf: csrfToken }) } : {}),
		redirect: 'manual'
	});
}
