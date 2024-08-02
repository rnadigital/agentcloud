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
		const storedTheme = localStorage.getItem('theme') as 'dark' | 'light';
		if (storedTheme) {
			setTheme(storedTheme);
		}
	}, []);

	useEffect(() => {
		document.documentElement.className = theme;
		localStorage.setItem('theme', theme);
	}, [theme]);

	useEffect(() => {
		if (localStorage.getItem('theme') !== 'dark' || localStorage.getItem('theme') !== 'light') {
			const checkDarkMode = () => {
				const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
				setTheme(darkModeMediaQuery.matches ? 'dark' : 'light');
			};

			checkDarkMode();

			const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			darkModeMediaQuery.addEventListener('change', checkDarkMode);

			return () => darkModeMediaQuery.removeEventListener('change', checkDarkMode);
		}
	}, []);

	const toggleTheme = () => {
		setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
	};

	return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => useContext(ThemeContext);
