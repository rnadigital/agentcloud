import React from 'react';

interface SpinnerProps {
	loadingText?: string;
	color?: string;
}

const Spinner: React.FC<SpinnerProps> = function ({ loadingText, color = 'white' }) {
	const spinnerClasses = `w-16 h-16 rounded-full animate-spin border-4 border-solid border-${color}-500 border-t-transparent`;

	return (
		<div className='ms-[140px] absolute left-1/2 bottom-1/2 transform -translate-x-1/2 -translate-y-1/2'>
			<div className={spinnerClasses}></div>
			<br />
			{loadingText}
		</div>
	);
};

export default Spinner;
