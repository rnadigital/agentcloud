import * as API from '@api';
import { useChatContext } from 'context/chat';
import { useSocketContext } from 'context/socket';
import { useRouter } from 'next/router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
const NotificationContext = createContext([]);

export function NotificationWrapper({ children }) {

	const router = useRouter();
	const { resourceSlug } = router.query;
	const [sharedState, setSharedState] = useState([]);
	const [_chatContext, setChatContext]: any = useChatContext();
	const [socketContext]: any = useSocketContext();

	function refreshNotificationContext() {
		console.log('refreshNotificationContext');
		if (!resourceSlug) { return; }
		API.getNotifications({
			resourceSlug,
		}, (data) => {
			console.log('refreshNotificationContext', data);
			setSharedState(data);
		}, null, null);
	}
	
	useEffect(() => {
		refreshNotificationContext();
	}, []); //TODO: what should be the variables?

	return (
		<NotificationContext.Provider value={[sharedState, refreshNotificationContext]}>
			{children}
		</NotificationContext.Provider>
	);

}

export function useNotificationContext() {
	return useContext(NotificationContext);
}
