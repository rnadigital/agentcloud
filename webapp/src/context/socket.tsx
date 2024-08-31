import { useAccountContext } from 'context/account';
import debug from 'debug';
import { useRouter } from 'next/router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { NotificationType, WebhookType } from 'struct/notification';
const log = debug('webapp:context:socket');

let socketio;
if (typeof window !== 'undefined') {
	socketio = io({
		reconnection: true,
		reconnectionAttempts: 100
	});
}

const SocketContext = createContext(socketio);

export function SocketWrapper({ children }) {
	const router = useRouter();
	const [accountContext]: any = useAccountContext();
	const { account } = accountContext as any;
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;
	const [sharedSocket, _setSharedSocket] = useState(socketio);
	const [_room, setRoom] = useState(resourceSlug);

	//TODO: move these into a "trigger" context for global events, maybe switch to useReducer
	const [notificationTrigger, setNotificationTrigger] = useState(null);
	const [sessionTrigger, setSessionTrigger] = useState(false);

	function handleNotification(notification) {
		if (notification?.description) {
			toast.success(notification?.description);
		}
		setNotificationTrigger(notification);
	}

	function joinRoomAndListen() {
		if (!sharedSocket || !resourceSlug) {
			return;
		}
		setRoom(oldRoom => {
			log('Switching socket rooms, old room: %s, new room: %s', oldRoom, resourceSlug);
			sharedSocket.emit('leave_room', oldRoom);
			sharedSocket.emit('join_room', resourceSlug);
			sharedSocket.off('notification', handleNotification);
			sharedSocket.on('notification', handleNotification);
			return resourceSlug;
		});
	}

	useEffect(() => {
		joinRoomAndListen();
		return () => {
			sharedSocket?.off('notification', handleNotification);
		};
	}, [sharedSocket, resourceSlug]);

	useEffect(() => {
		if (router.asPath.includes('/session/')) {
			setSessionTrigger(!sessionTrigger);
		}
	}, [router.asPath]);

	function tryReconnect() {
		if (sharedSocket.connected === false && sharedSocket.connecting === false) {
			sharedSocket.connect();
		}
	}

	useEffect(() => {
		sharedSocket.disconnect();
		tryReconnect();
	}, [resourceSlug]);

	useEffect(() => {
		sharedSocket.connect();
		const reconnectInterval = setInterval(tryReconnect, 10000);
		return () => {
			clearInterval(reconnectInterval);
		};
	}, []);

	return (
		<SocketContext.Provider value={[sharedSocket, notificationTrigger, sessionTrigger] as any}>
			{children}
		</SocketContext.Provider>
	);
}

export function useSocketContext() {
	return useContext(SocketContext);
}
