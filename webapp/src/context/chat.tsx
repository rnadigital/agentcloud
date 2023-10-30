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

	useEffect(() => {
		if (router?.asPath
			&& !router.asPath.includes('/session/')) {
			setSharedState({});
		}
	}, [router.asPath]);

	log('ChatWrapper sharedState %O', sharedState);

	return (
		<ChatContext.Provider value={[sharedState, setSharedState]}>
			{children}
		</ChatContext.Provider>
	);
}

export function useChatContext() {
	return useContext(ChatContext);
}
