import { useRouter } from 'next/router';
import React, { createContext, useContext, useEffect, useState } from 'react';

const StepContext = createContext({});

export function StepWrapper({ children }) {
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [step, setStep] = useState(0);
	const isAppAdd = router?.asPath?.includes('/app/add');

	useEffect(() => {
		if (isAppAdd) {
			const hashStep = parseInt(window.location.hash.replace('#step', ''), 10);
			if (hashStep) {
				setStep(hashStep - 1);
			}
		}
	}, []);

	useEffect(() => {
		if (isAppAdd) {
			window.location.hash = `#step${step + 1}`;
		}
	}, [step, isAppAdd]);

	useEffect(() => {
		if (!isAppAdd) {
			setStep(0);
		}
	}, [router?.asPath]);

	return (
		<StepContext.Provider value={{ step, setStep }}>
			{children}
		</StepContext.Provider>
	);
}

export function useStepContext() {
	return useContext(StepContext);
}
