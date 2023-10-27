import React, { createContext, useContext, useState, useEffect } from 'react';
import * as API from '../api';
import { useRouter } from 'next/router';

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

	console.log('ChatWrapper sharedState', sharedState);

	return (
		<ChatContext.Provider value={[sharedState, setSharedState]}>
			{children}
		</ChatContext.Provider>
	);
}

export function useChatContext() {
	return useContext(ChatContext);
}
