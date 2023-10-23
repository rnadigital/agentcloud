import React, { createContext, useContext, useState, useEffect } from 'react';
import * as API from '../api';

const AccountContext = createContext({});

export function AccountWrapper({ children, pageProps }) {

	const [sharedState, setSharedState] = useState({
		...pageProps,
		//TODO: this jank on the server side instead
		orgName: pageProps?.account?.orgs?.find(o => o.id === pageProps?.account?.currentOrg)?.name,
		teamName: pageProps?.account?.orgs?.find(o => o.id === pageProps?.account?.currentOrg)?.teams.find(t => t.id === pageProps?.account?.currentTeam)?.name
	});
	
	useEffect(() => {
		if (!sharedState || !sharedState.account) {
			API.getAccount(setSharedState, null, null);
		}
	}, []);

	console.log('AppWrapper sharedState', sharedState);
	return (
		<AccountContext.Provider value={sharedState}>
			{children}
		</AccountContext.Provider>
	);
}

export function useAccountContext() {
	return useContext(AccountContext);
}
