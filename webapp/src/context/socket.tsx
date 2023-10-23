import React, { createContext, useState, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';

let socketio = io({
	// transports: ["websocket"],
});
const SocketContext = createContext(socketio);

export function SocketWrapper({ children }) {
	const [sharedSocket, _setSharedSocket] = useState(socketio);
	return (
		<SocketContext.Provider value={sharedSocket}>
			{children}
		</SocketContext.Provider>
	);
}

export function useSocketContext() {
	return useContext(SocketContext);
}
