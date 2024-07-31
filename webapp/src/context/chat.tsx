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
		// log('updateSharedState', update);
		posthog.group('session', update?.app?._id);
		if (update == null) {
			return setSharedState({});
		}
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
			posthog.group('session', null);
		}
	}, [router.asPath]);

	return (
		<ChatContext.Provider value={[sharedState, updateSharedState]}>{children}</ChatContext.Provider>
	);
}

export function useChatContext() {
	return useContext(ChatContext);
}
