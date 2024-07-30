import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextProps {
	theme?: 'dark' | 'light';
	toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
	toggleTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState<'dark' | 'light'>();

	useEffect(() => {
		document.documentElement.className = theme;
		localStorage.setItem('theme', theme);
	}, [theme]);

	const toggleTheme = () => {
		setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
	};

	return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => useContext(ThemeContext);
