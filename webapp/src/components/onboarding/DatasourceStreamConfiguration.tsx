import ButtonSpinner from 'components/ButtonSpinner';
import { useOnboardingFormContext } from 'context/onboardingform';
import React from 'react';

import { StreamsList } from './OldDatasourceStream';

interface DatasourceStreamConfigurationProps {
	discoveredSchema: any;
	streamProperties: any;
	setStreamReducer: Function;
	submitting: boolean;
	setStep: Function;
}

const DatasourceStreamConfiguration = ({
	setStreamReducer,
	submitting,
	setStep
}: {
	setStreamReducer: Function;
	submitting: boolean;
	setStep: Function;
}) => {
	const { watch } = useOnboardingFormContext();
	const stagedDatasource = watch('stagedDatasource');

	return (
		<form
			onSubmit={(e: any) => {
				e.preventDefault();
				setStep(2);
			}}
			className='border border-gray-200 px-4 pb-4'
		>
			<StreamsList
				streams={stagedDatasource.discoveredSchema.catalog?.streams}
				streamProperties={stagedDatasource.streamProperties}
				setStreamReducer={setStreamReducer}
			/>
			<div className='flex justify-end'>
				<button
					disabled={submitting}
					type='submit'
					className='rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
				>
					{submitting && <ButtonSpinner />}
					Continue
				</button>
			</div>
		</form>
	);
};

export default DatasourceStreamConfiguration;
