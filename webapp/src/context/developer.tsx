import React, { createContext, useContext, useEffect, useState } from 'react';

const DeveloperContext = createContext({});

export function DeveloperWrapper({ children }) {
	const [developerMode, setDeveloperMode] = useState(false);

	useEffect(() => {
		const isDeveloper = localStorage.getItem('developer') === '1';
		setDeveloperMode(isDeveloper);
	}, []);

	const toggleDeveloperMode = () => {
		const isDeveloper = localStorage.getItem('developer') === '1';
		localStorage.setItem('developer', isDeveloper === true ? '0' : '1');
	};

	return (
		<DeveloperContext.Provider value={{ developerMode, toggleDeveloperMode }}>
			{children}
		</DeveloperContext.Provider>
	);
}

export const useDeveloperContext = () => useContext(DeveloperContext);
