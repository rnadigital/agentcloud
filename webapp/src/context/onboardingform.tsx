import { FieldValue, FieldValues, FormProvider, useForm } from 'react-hook-form';

const OnboardingFormContext = ({ children }: { children: React.ReactNode }) => {
	const methods = useForm();

	return <FormProvider {...methods}>{children}</FormProvider>;
};

export default OnboardingFormContext;

import { useFormContext } from 'react-hook-form';

export const useOnboardingFormContext = <TFieldValues extends FieldValues>() => {
	// Updated to extend Record
	const context = useFormContext<TFieldValues>();
	if (!context) {
		// ... existing code ...
	}
	return context;
};
