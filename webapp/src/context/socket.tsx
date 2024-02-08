import { useNotificationContext } from 'context/notifications';
import { useRouter } from 'next/router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

let socketio = io({ /* transports: ["websocket"] */ });
const SocketContext = createContext(socketio);

export function SocketWrapper({ children }) {

	const router = useRouter();
	const { resourceSlug } = router.query;
	const [notificationContext, _setNotificationContext]: any = useNotificationContext();
	const [sharedSocket, _setSharedSocket] = useState(socketio);

	function joinRoomAndListen() {
		if (!sharedSocket || !resourceSlug) { return; }
		sharedSocket.emit('join_room', resourceSlug);
		console.log('joined room');
		sharedSocket.on('notification', console.log);
		//TODO: handle notifications and use notificationContext/setnotificationContext
	}

	useEffect(() => {
		// joinRoomAndListen();
		//TODO: handle leaving old room on changing resourceSlug
		return () => {
			sharedSocket?.off('notification');
		};
	}, [sharedSocket, resourceSlug]);

	return (
		<SocketContext.Provider value={sharedSocket}>
			{children}
		</SocketContext.Provider>
	);

}

export function useSocketContext() {
	return useContext(SocketContext);
}
