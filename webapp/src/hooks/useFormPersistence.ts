import { useFormContext } from 'react-hook-form';
import { useEffect, useState, useRef } from 'react';
import { useDatasourceStore } from 'store/datasource';

interface UseFormPersistenceOptions {
	formId?: string;
	enableAutoSave?: boolean;
	enableAutoRestore?: boolean;
}

export const useFormPersistence = (options: UseFormPersistenceOptions = {}) => {
	const { formId = 'default', enableAutoSave = true, enableAutoRestore = true } = options;

	const methods = useFormContext();
	const [hasRestoredData, setHasRestoredData] = useState(false);
	const hasRestoredRef = useRef(false);

	const {
		saveFormData,
		loadFormData,
		clearFormData,
		restoreFormData,
		hasSavedData,
		saveOneOfSelection,
		loadOneOfSelection,
		clearOneOfSelection
	} = useDatasourceStore();

	useEffect(() => {
		if (enableAutoRestore && methods && formId && !hasRestoredRef.current) {
			const savedData = loadFormData(formId);
			if (savedData) {
				methods.reset(savedData);
				setHasRestoredData(true);
				hasRestoredRef.current = true;
			}
		}
	}, [enableAutoRestore, formId]);

	useEffect(() => {
		if (enableAutoSave && methods && formId) {
			const subscription = methods.watch(data => {
				if (data && Object.keys(data).length > 0) {
					saveFormData(formId, data);
				}
			});

			return () => subscription.unsubscribe();
		}
	}, [methods, enableAutoSave, formId]);

	return {
		saveFormData: (data: any) => formId && saveFormData(formId, data),
		loadFormData: () => (formId ? loadFormData(formId) : null),
		clearFormData: () => formId && clearFormData(formId),
		restoreFormData: () => (formId && methods ? restoreFormData(formId, methods) : false),
		hasSavedData: () => (formId ? hasSavedData(formId) : false),
		hasRestoredData,
		setHasRestoredData,
		saveOneOfSelection,
		loadOneOfSelection,
		clearOneOfSelection
	};
};
