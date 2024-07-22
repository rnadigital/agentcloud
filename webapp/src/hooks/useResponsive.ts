import { useMediaQuery } from 'react-responsive';

const useResponsive = () => {
	const isDesktop = useMediaQuery({ minWidth: 1024 });
	const isTablet = useMediaQuery({ minWidth: 768 });
	const isMobile = useMediaQuery({ maxWidth: 768 });

	return {
		isDesktop,
		isTablet,
		isMobile
	};
};

export default useResponsive;
