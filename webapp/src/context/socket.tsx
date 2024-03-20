import { useRouter } from 'next/router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

let socketio = io({ /* transports: ["websocket"] */ });
const SocketContext = createContext(socketio);

export function SocketWrapper({ children }) {

	const router = useRouter();
	const { resourceSlug } = router.query;
	const [sharedSocket, _setSharedSocket] = useState(socketio);
	const [notificationTrigger, setNotificationTrigger] = useState(false);

	function joinRoomAndListen() {
		if (!sharedSocket || !resourceSlug) { return; }
		sharedSocket.emit('join_room', resourceSlug);
		console.log('joined room');
		// sharedSocket.onAny((eventName, ...args) => {
		// 	console.log('Socket eventName:', eventName, args);
		// });
		sharedSocket.on('notification', msg => {
			console.log('notification', msg);
			toast('New Notification!');
		    setNotificationTrigger(prevState => !prevState);
		});
	}

	useEffect(() => {
		joinRoomAndListen();
		//TODO: handle leaving old room on changing resourceSlug
		return () => {
			sharedSocket?.off('notification');
		};
	}, [sharedSocket, resourceSlug]);

	return (
		<SocketContext.Provider value={[sharedSocket, notificationTrigger] as any}>
			{children}
		</SocketContext.Provider>
	);

}

export function useSocketContext() {
	return useContext(SocketContext);
}
