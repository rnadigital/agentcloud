import * as API from '@api';
import debug from 'debug';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
const log = debug('webapp:context');

const AccountContext = createContext({});

function getTeamAndOrgName(data) {
	return {
		orgName: data?.account?.orgs?.find(o => o.id === data?.account?.currentOrg)?.name || 'Loading...',
		teamName: data?.account?.orgs?.find(o => o.id === data?.account?.currentOrg)?.teams.find(t => t.id === data?.account?.currentTeam)?.name || 'Loading...',
	};
}

export function AccountWrapper({ children, pageProps }) {

	const router = useRouter();
	const { resourceSlug, memberId } = (router?.query||{});
	const [sharedState, setSharedState] = useState({
		...pageProps,
		...getTeamAndOrgName(pageProps),
		switching: false,
	});

	function refreshAccountContext() {
		API.getAccount({ resourceSlug, memberId }, (data) => {
			setSharedState({
				...pageProps,
				...data,
				...getTeamAndOrgName(data),
				switching: false,
			});
		}, null, null);
	}

	function setSwitchingContext(switching: boolean) {
		setSharedState({
			...sharedState,
			...getTeamAndOrgName(sharedState),
			switching,
		});
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

	return (
		<AccountContext.Provider value={[sharedState, refreshAccountContext, setSwitchingContext]}>
			{children}
		</AccountContext.Provider>
	);
}

export function useAccountContext() {
	return useContext(AccountContext);
}
