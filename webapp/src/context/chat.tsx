import debug from 'debug';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { createContext, useContext, useEffect, useState } from 'react';

import * as API from '../api';
const log = debug('webapp:context');

const ChatContext = createContext({});

export function ChatWrapper({ children }) {
	const router = useRouter();
	const [sharedState, setSharedState] = useState({});
	const posthog = usePostHog();

	function refreshChatContext(data) {
		//API call??
		setSharedState(data);
	}

	function updateSharedState(update: any) {
		if (update == null) {
			return setSharedState({});
		}
		const { name, orgId, teamId, startDate, appId } = update?.session || {};
		posthog.group('session', update?.app?._id, {
			name,
			orgId,
			teamId,
			startDate,
			appId,
			appSharingMode: update?.app?.sharingConfig?.mode,
			sessionSharingMode: update?.session?.sharingConfig?.mode
		});
		setSharedState(oldState => {
			return {
				...oldState,
				...update
			};
		});
	}

	useEffect(() => {
		if (router?.asPath && !router.asPath.includes('/session/')) {
			setSharedState(null);
			posthog.group('session', null, {});
		}
	}, [router.asPath]);

	return (
		<ChatContext.Provider value={[sharedState, updateSharedState]}>{children}</ChatContext.Provider>
	);
}

export function useChatContext() {
	return useContext(ChatContext);
}
