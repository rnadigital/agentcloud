import { useRouter } from 'next/router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { NotificationType, WebhookType } from 'struct/notification';

let socketio;
if (typeof window !== 'undefined') {
	socketio = io(/*{
		transports: ["websocket", "polling"],
	}*/);
}

const SocketContext = createContext(socketio);

export function SocketWrapper({ children }) {

	const router = useRouter();
	const { resourceSlug } = router.query;
	const [sharedSocket, _setSharedSocket] = useState(socketio);

	//TODO: move these into a "trigger" context for global events, maybe switch to useReducer
	const [notificationTrigger, setNotificationTrigger] = useState(null);
	const [sessionTrigger, setSessionTrigger] = useState(false);

	function joinRoomAndListen() {
		if (!sharedSocket || !resourceSlug) { return; }
		sharedSocket.emit('join_room', resourceSlug);		
		sharedSocket.on('notification', notification => {

			if (notification?.description
				&& notification?.type === NotificationType.Webhook
				&& notification?.details?.webhookType === WebhookType.SuccessfulSync) {
				toast.success(notification?.description);
			}
		
		    setNotificationTrigger(notification);
		});
	}

	useEffect(() => {
		joinRoomAndListen();
		//TODO: handle leaving old room on changing resourceSlug
		return () => {
			sharedSocket?.off('notification');
		};
	}, [sharedSocket, resourceSlug]);

	useEffect(() => {
		if (router.asPath.includes('/session/')) {
			setSessionTrigger(!sessionTrigger);
		}
	}, [router.asPath]);

	return (
		<SocketContext.Provider value={[sharedSocket, notificationTrigger, sessionTrigger] as any}>
			{children}
		</SocketContext.Provider>
	);

}

export function useSocketContext() {
	return useContext(SocketContext);
}
