import * as API from '@api';
import debug from 'debug';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
const log = debug('webapp:context');
import Permission from '@permission';
import { usePostHog } from 'posthog-js/react';
const AccountContext = createContext({});

function getTeamAndOrgName(data) {
	return {
		orgName:
			data?.account?.orgs?.find(o => o.id === data?.account?.currentOrg)?.name || 'Loading...',
		teamName:
			data?.account?.orgs
				?.find(o => o.id === data?.account?.currentOrg)
				?.teams.find(t => t.id == data?.account?.currentTeam)?.name || 'Loading...'
	};
}

export function AccountWrapper({ children, pageProps }) {
	const posthog = usePostHog();
	const router = useRouter();
	const { resourceSlug, memberId } = router?.query || {};
	const [sharedState, setSharedState] = useState({
		...pageProps,
		...getTeamAndOrgName(pageProps),
		switching: false,
		permissions: new Permission(pageProps?.account?.permissions)
	});

	function refreshAccountContext() {
		API.getAccount(
			{
				...(resourceSlug ? { resourceSlug } : { resourceSlug: sharedState?.account?.currentTeam }),
				...(memberId ? { memberId } : {})
			},
			data => {
				const { orgName, teamName } = getTeamAndOrgName(data);
				posthog.group('org', data?.account?.currentOrg, {
					orgName
				});
				posthog.group('team', data?.account?.currentTeam, {
					teamName
				});
				const updatedState = {
					...pageProps,
					...data,
					teamName,
					orgName,
					switching: false
				};
				if (data?.account?.permissions) {
					updatedState['permissions'] = new Permission(data?.account?.permissions);
				}
				setSharedState(updatedState);
			},
			null,
			null
		);
	}

	function setSwitchingContext(switching: boolean) {
		setSharedState({
			...sharedState,
			...getTeamAndOrgName(sharedState),
			switching
		});
	}

	function setDatalayerUser(data) {
		if (typeof window !== 'undefined') {
			if (!data) {
				//@ts-ignore
				return window.acdl && delete window.acdl;
			}
			const { user } = data;
			if (!user) {
				return;
			}
			//@ts-ignore
			window.acdl = {
				user: {
					userId: user?._id,
					email: user?.email,
					orgId: user?.currentOrg,
					teamId: user?.currentTeam,
					stripeCustomerId: user?.stripe?.stripeCustomerId,
					...getTeamAndOrgName(data),
					stripe: user?.stripe,
					_stripe: user?._stripe
				}
			};
		}
	}

	useEffect(() => {
		if (!sharedState || !sharedState.account) {
			refreshAccountContext();
		}
	}, [router.asPath]);

	useEffect(() => {
		refreshAccountContext();
	}, [resourceSlug, memberId]);

	useEffect(() => {
		if (sharedState?.account?.name) {
			posthog.identify(sharedState.account._id, {
				email: sharedState.account.email,
				name: sharedState.account.name
			});
			setDatalayerUser(sharedState);
		} else {
			posthog.reset();
			setDatalayerUser(null);
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
