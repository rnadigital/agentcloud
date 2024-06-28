import { FormProvider,useForm } from 'react-hook-form';

const FormContext = ({ children, }: { children: React.ReactNode }) => {
	const methods = useForm();

	return (
		<FormProvider {...methods}>
			{children}
		</FormProvider>
	);
};

export default FormContext;

import { useFormContext } from 'react-hook-form';

export const useFormContextHook = () => {

	const context = useFormContext();
	if (!context) {
		throw new Error('useFormContextHook must be used within a FormProvider');
	}
	return context;
};

