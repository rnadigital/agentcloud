import { createContext, useContext } from 'react';

export const ConnectionsContext = createContext(null);

export function ConnectionsProvider({ children, value }) {
	return <ConnectionsContext.Provider value={value}>{children}</ConnectionsContext.Provider>;
}

export function useConnections() {
	const context = useContext(ConnectionsContext);
	if (!context) {
		throw new Error('useConnections must be used within ConnectionsProvider');
	}
	return context;
}
