import { FieldValue, FieldValues, FormProvider, useForm } from 'react-hook-form';
import { useFormPersistence } from 'hooks/useFormPersistence';

interface OnboardingFormContextProps {
	children: React.ReactNode;
	formId?: string;
	enablePersistence?: boolean;
}

const OnboardingFormContext = ({
	children,
	formId,
	enablePersistence = true
}: OnboardingFormContextProps) => {
	const methods = useForm();

	return (
		<FormProvider {...methods}>
			<OnboardingFormPersistenceWrapper formId={formId} enablePersistence={enablePersistence}>
				{children}
			</OnboardingFormPersistenceWrapper>
		</FormProvider>
	);
};

const OnboardingFormPersistenceWrapper = ({
	children,
	formId,
	enablePersistence
}: {
	children: React.ReactNode;
	formId?: string;
	enablePersistence?: boolean;
}) => {
	useFormPersistence({
		formId: formId || 'onboarding_form',
		enableAutoSave: enablePersistence,
		enableAutoRestore: enablePersistence
	});

	return <>{children}</>;
};

export default OnboardingFormContext;

import { useFormContext } from 'react-hook-form';

export const useOnboardingFormContext = <TFieldValues extends FieldValues>() => {
	const context = useFormContext<TFieldValues>();
	if (!context) {
		throw new Error('useOnboardingFormContext must be used within a FormProvider');
	}
	return context;
};
