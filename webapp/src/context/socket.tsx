import { useRouter } from 'next/router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

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
	const [notificationTrigger, setNotificationTrigger] = useState(false);
	const [sessionTrigger, setSessionTrigger] = useState(false);

	function joinRoomAndListen() {
		if (!sharedSocket || !resourceSlug) { return; }
		sharedSocket.emit('join_room', resourceSlug);
		console.log('joined room');
		// sharedSocket.onAny((eventName, ...args) => {
		// 	console.log('Socket eventName:', eventName, args);
		// });
		// sharedSocket.on("connect_error", () => {
		// 	// revert to classic upgrade
		// 	sharedSocket.io.opts.transports = ["polling", "websocket"];
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
