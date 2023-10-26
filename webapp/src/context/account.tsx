import React, { createContext, useContext, useState, useEffect } from 'react';
import * as API from '../api';
import { useRouter } from 'next/router';

const AccountContext = createContext({});

function getTeamAndOrgName(data) {
	return {
		orgName: data?.account?.orgs?.find(o => o.id === data?.account?.currentOrg)?.name,
		teamName: data?.account?.orgs?.find(o => o.id === data?.account?.currentOrg)?.teams.find(t => t.id === data?.account?.currentTeam)?.name
	};
}

export function AccountWrapper({ children, pageProps }) {

	const router = useRouter();
	const [sharedState, setSharedState] = useState({
		...pageProps,
		...getTeamAndOrgName(pageProps),
	});

	function refreshAccountContext() {
		API.getAccount((data) => {
			setSharedState({
				...pageProps,
				...data,
				...getTeamAndOrgName(data),
			});
		}, null, null);
	}
	
	useEffect(() => {
		if (!sharedState || !sharedState.account) {
			refreshAccountContext();
		}
	}, [router.asPath]);

	console.log('AppWrapper sharedState', sharedState);

	return (
		<AccountContext.Provider value={[sharedState, refreshAccountContext]}>
			{children}
		</AccountContext.Provider>
	);
}

export function useAccountContext() {
	return useContext(AccountContext);
}
