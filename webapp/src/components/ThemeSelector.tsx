import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { ThemeContext } from 'context/themecontext';
import { useContext } from 'react';

const ThemeSelector = () => {
	const { theme, toggleTheme } = useContext(ThemeContext);

	return (
		<button onClick={toggleTheme} className='absolute right-5 top-2'>
			{theme === 'dark' ? (
				<MoonIcon className='text-white h-6 w-6' />
			) : (
				<SunIcon className='h-6 w-6' />
			)}
		</button>
	);
};

export default ThemeSelector;
