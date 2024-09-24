
let accountInformationMap: Map<String, any> = new Map();
export enum fetchTypes {
	POST = 'POST',
	GET = 'GET',
	DELETE = 'DELETE'
}

export enum accountDetails {
    account1_email = 'testuser+1@example.com',
    account1_name = 'Test User1',
    account1_password = 'Test.Password123',
    
    account2_email = "testuser+2@example.com",
    account2_name = "Test User2",
    account2_password = "Test.Password.1234",

    account3_email = "testuser+3@example.com",
    account3_name = "Test User3",
    account3_password = "Test.Password.1234",
}

export function setInitialData(email: string, initialData: any){
	accountInformationMap.set(email, initialData);
}

export async function getInitialData(email: string) {
	const initialData = accountInformationMap.get(email);
	const sessionCookie = initialData?.sessionCookie;
	const resourceSlug = initialData?.accountData?.account?.currentTeam;
	const csrfToken = initialData?.accountData?.csrf;

	return { initialData, sessionCookie, resourceSlug, csrfToken };
}

export async function makeFetch(URL: string, type: fetchTypes, accountEmail: string, body?: any) {
	const { initialData, sessionCookie, resourceSlug, csrfToken } = await getInitialData(accountEmail);
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
