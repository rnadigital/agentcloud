import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useFormPersistence } from 'hooks/useFormPersistence';

interface FormContextProps {
	children: React.ReactNode;
	schema?: any;
	formId?: string;
	enablePersistence?: boolean;
}

const FormContext = ({ children, schema, formId, enablePersistence = true }: FormContextProps) => {
	const methods = useForm();

	useEffect(() => {
		if (schema && schema.properties) {
			methods.reset();
		}
	}, [schema]);

	return (
		<FormProvider {...methods}>
			<FormPersistenceWrapper formId={formId} enablePersistence={enablePersistence}>
				{children}
			</FormPersistenceWrapper>
		</FormProvider>
	);
};

const FormPersistenceWrapper = ({
	children,
	formId,
	enablePersistence
}: {
	children: React.ReactNode;
	formId?: string;
	enablePersistence?: boolean;
}) => {
	useFormPersistence({
		formId: formId || 'connector_form',
		enableAutoSave: enablePersistence,
		enableAutoRestore: enablePersistence
	});

	return <>{children}</>;
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
