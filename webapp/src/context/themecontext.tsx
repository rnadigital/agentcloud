import React, { createContext, useEffect, useState } from 'react';

interface ThemeContextProps {
	theme?: string;
	toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
	toggleTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState<string>();

	useEffect(() => {
		document.documentElement.className = theme;
		localStorage.setItem('theme', theme);
	}, [theme]);

	const toggleTheme = () => {
		setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
	};

	return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};
