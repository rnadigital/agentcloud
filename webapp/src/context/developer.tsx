import React, { Context, createContext, useContext, useEffect, useState } from 'react';

export type DeveloperContextProps = {
	developerMode: boolean;
	toggleDeveloperMode: Function;
};

const DeveloperContext: Context<DeveloperContextProps> = createContext(null);

export function DeveloperWrapper({ children }) {
	const [developerMode, setDeveloperMode] = useState(false);

	useEffect(() => {
		const isDeveloper = localStorage.getItem('developer') === '1';
		setDeveloperMode(isDeveloper);
	}, []);

	const toggleDeveloperMode = () => {
		const isDeveloper = localStorage.getItem('developer') === '1';
		localStorage.setItem('developer', isDeveloper === true ? '0' : '1');
		setDeveloperMode(!isDeveloper);
	};

	return (
		<DeveloperContext.Provider value={{ developerMode, toggleDeveloperMode }}>
			{children}
		</DeveloperContext.Provider>
	);
}

export const useDeveloperContext = () => useContext(DeveloperContext);
