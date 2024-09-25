
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
    
    account2_email = 'testuser+2@example.com',
    account2_name = 'Test User2',
    account2_password = 'Test.Password.1234',
    
    account3_email = 'testuser+3@example.com',
    account3_name = 'Test User3',
    account3_password = 'Test.Password.1234',
    
    account4_email = 'testuser+4@example.com',
    account4_name = 'Test User4',
    account4_password = 'Test.Password12345',
    
    account5_email = 'testuser+5@example.com',
    account5_name = 'Test User5',
    account5_password = 'Test.Password.54321',
    
    account6_email = 'testuser+6@example.com',
    account6_name = 'Test User6',
    account6_password = 'Test.Password123456',
    
    account7_email = 'testuser+7@example.com',
    account7_name = 'Test User7',
    account7_password = 'Test.Password654321',
    
    account8_email = 'testuser+8@example.com',
    account8_name = 'Test User8',
    account8_password = 'Test.Password123789',
    
    account9_email = 'testuser+9@example.com',
    account9_name = 'Test User9',
    account9_password = 'Test.Password789123',
    
    account10_email = 'testuser+10@example.com',
    account10_name = 'Test User10',
    account10_password = 'Test.Password987654',

    account11_email = 'testuser+11@example.com',
    account11_name = 'Test User11',
    account11_password = 'Test.Password456789'
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
			...(type === fetchTypes.POST|| type === fetchTypes.DELETE ? { 'content-type': 'application/json' } : {})
		},
		...(body|| type === fetchTypes.DELETE  ? { body: JSON.stringify({ ...body, _csrf: csrfToken }) } : {}),
		redirect: 'manual'
	});
}

export async function updateAllAccountCsrf() {
    let url = `${process.env.WEBAPP_TEST_BASE_URL}/account.json`;
	
    for(let i=1; i>=11; i++) {
        const accountStr = `account${(i).toString()}_email`;
        let response = await makeFetch(url, fetchTypes.GET, accountDetails[accountStr]);
        let accountJson = await response.json();
        const { sessionCookie } = await getInitialData(accountDetails[accountStr]);
        setInitialData(accountDetails[accountStr], { accountData: accountJson, sessionCookie });
    };
}