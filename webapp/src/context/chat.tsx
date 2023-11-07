import React, { createContext, useContext, useState, useEffect } from 'react';
import * as API from '../api';
import { useRouter } from 'next/router';
import debug from 'debug';
const log = debug('webapp:context');

const ChatContext = createContext({});

export function ChatWrapper({ children }) {

	const router = useRouter();
	const [sharedState, setSharedState] = useState({});

	function refreshChatContext(data) {
		//API call??
		setSharedState(data);
	}

	function updateSharedState(update: any) {
		if (update == null) {
			return setSharedState({});
		}
		setSharedState({
			...sharedState,
			...update,
		});
	}

	useEffect(() => {
		if (router?.asPath
			&& !router.asPath.includes('/session/')) {
			setSharedState(null);
		}
	}, [router.asPath]);

	log('ChatWrapper sharedState %O', sharedState);

	return (
		<ChatContext.Provider value={[sharedState, updateSharedState]}>
			{children}
		</ChatContext.Provider>
	);
}

export function useChatContext() {
	return useContext(ChatContext);
}
