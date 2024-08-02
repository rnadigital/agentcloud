import * as API from '@api';
import { useAccountContext } from 'context/account';
import { useSocketContext } from 'context/socket';
import debug from 'debug';
import { useRouter } from 'next/router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
const log = debug('webapp:context:notifications');

const NotificationContext = createContext({});

export function NotificationWrapper({ children }) {
	const [accountContext]: any = useAccountContext();
	const { csrf, account } = accountContext as any;
	const router = useRouter();
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;
	const [sharedState, setSharedState] = useState([]);
	const [, notificationTrigger]: any = useSocketContext();
	const [socketContext]: any = useSocketContext();

	function refreshNotificationContext() {
		log('refreshNotificationContext()');
		if (!resourceSlug) {
			return;
		}
		API.getNotifications(
			{
				resourceSlug
			},
			data => {
				log('refreshNotificationContext', data);
				setSharedState(data?.notifications);
			},
			null,
			null
		);
	}

	useEffect(() => {
		refreshNotificationContext();
	}, [notificationTrigger]); //TODO: what should be the variables?

	return (
		<NotificationContext.Provider value={[sharedState, refreshNotificationContext]}>
			{children}
		</NotificationContext.Provider>
	);
}

export function useNotificationContext() {
	return useContext(NotificationContext);
}
