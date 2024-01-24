import debug from 'debug';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

import * as API from '../api';
const log = debug('webapp:context');

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

	useEffect(() => {
		if (sharedState?.account?.name) {
			posthog.identify(
				sharedState.account._id,
				{ email: sharedState.account.email, name: sharedState.account.name },
			);
		} else {
			posthog.reset();
		}
	}, [sharedState?.account?.name]);

	log('AppWrapper sharedState %O', sharedState);

	return (
		<AccountContext.Provider value={[sharedState, refreshAccountContext]}>
			{children}
		</AccountContext.Provider>
	);
}

export function useAccountContext() {
	return useContext(AccountContext);
}
