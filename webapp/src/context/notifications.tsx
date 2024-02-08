import * as API from '@api';
import { useChatContext } from 'context/chat';
import { useRouter } from 'next/router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
const NotificationContext = createContext([]);

export function NotificationWrapper({ children }) {

	const router = useRouter();
	const { resourceSlug } = router.query;
	const [sharedState, setSharedState] = useState([]);
	const [_chatContext, setChatContext]: any = useChatContext();

	function refreshNotificationContext() {
		if (!resourceSlug) { return; }
		API.getNotifications({
			resourceSlug,
		}, (data) => {
			console.log('refreshNotificationContext', data);
			setSharedState(data?.notifications);
		}, null, null);
	}
	
	useEffect(() => {
		if (!Array.isArray(sharedState)) {
			refreshNotificationContext();
		}
	}, [router.asPath]);

	return (
		<NotificationContext.Provider value={sharedState}>
			{children}
		</NotificationContext.Provider>
	);

}

export function useNotificationContext() {
	return useContext(NotificationContext);
}
