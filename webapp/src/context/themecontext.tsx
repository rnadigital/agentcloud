import React, { createContext, useContext, useEffect, useState } from 'react';
import local from 'secret/local';

interface ThemeContextProps {
	theme?: 'dark' | 'light';
	toggleTheme: (theme: 'dark' | 'light') => void;
	toggleUseSystemTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
	toggleTheme: (theme: 'dark' | 'light') => {},
	toggleUseSystemTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState<'dark' | 'light'>('light');
	const [useSystemTheme, setUseSystemTheme] = useState(false);

	useEffect(() => {
		const storedTheme = localStorage.getItem('theme') as 'dark' | 'light';
		const useSystemTheme = localStorage.getItem('useSystemTheme') === 'true';
		if (storedTheme) {
			setTheme(storedTheme);
		}
		setUseSystemTheme(useSystemTheme);
	}, []);

	useEffect(() => {
		document.documentElement.className = theme;
		localStorage.setItem('theme', theme);
	}, [theme]);

	useEffect(() => {
		const checkDarkMode = () => {
			const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			if (useSystemTheme) {
				setTheme(darkModeMediaQuery.matches ? 'dark' : 'light');
			}
		};

		checkDarkMode();

		const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		darkModeMediaQuery.addEventListener('change', checkDarkMode);

		return () => darkModeMediaQuery.removeEventListener('change', checkDarkMode);
	}, [useSystemTheme]);

	const toggleTheme = (theme: 'dark' | 'light') => {
		setTheme(theme);
		setUseSystemTheme(false);
	};

	const toggleUseSystemTheme = () => {
		setUseSystemTheme(prev => !prev);
		localStorage.setItem('useSystemTheme', (!useSystemTheme).toString());
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme, toggleUseSystemTheme }}>
			{theme && children}
		</ThemeContext.Provider>
	);
};

export const useThemeContext = () => useContext(ThemeContext);
