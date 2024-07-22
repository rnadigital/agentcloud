import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

const FormContext = ({ children, schema }: { children: React.ReactNode; schema?: any }) => {
	const methods = useForm();

	useEffect(() => {
		if (schema && schema.properties) {
			methods.reset();
		}
	}, [schema]);

	return <FormProvider {...methods}>{children}</FormProvider>;
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
