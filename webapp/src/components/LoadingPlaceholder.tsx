import React from 'react';
import ContentLoader from 'react-content-loader';

const LoadingPlaceholder = props => (
	<ContentLoader
		speed={2}
		width={'100%'}
		height={30}
		viewBox='0 0 100% 10'
		backgroundColor='#2e2e2e'
		foregroundColor='#5a5a5a'
		{...props}
	>
		<rect x='0' y='10' rx='5' width='100%' height='10' />
	</ContentLoader>
);

export default LoadingPlaceholder;
