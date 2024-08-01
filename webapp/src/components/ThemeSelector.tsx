import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { ThemeContext } from 'context/themecontext';
import { useContext } from 'react';

const ThemeSelector = () => {
	const { theme, toggleTheme } = useContext(ThemeContext);

	return (
		<button onClick={toggleTheme} className='text-black dark:text-white'>
			{theme === 'dark' ? <MoonIcon className='h-6 w-6' /> : <SunIcon className='h-6 w-6' />}
		</button>
	);
};

export default ThemeSelector;
