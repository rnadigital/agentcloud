import InputField from 'components/form/InputField';
import SelectField from 'components/form/SelectField';
import { useOnboardinFormContext } from 'context/onboardingform';
import React from 'react';
import { Option } from 'react-tailwindcss-select/dist/components/type';

interface DataSourceDetailsFormValues {
	connectionName: string;
	region: string;
	chunkStrategy: string;
	retrievalStrategy: string;
	k: number;
}

const DataSourceDetails = () => {
	const { control } = useOnboardinFormContext<DataSourceDetailsFormValues>();
	return (
		<div className='text-gray-900 text-sm'>
			<InputField<DataSourceDetailsFormValues>
				name='connectionName'
				control={control}
				rules={{
					required: 'Name is required'
				}}
				label='Connection name*'
				type='text'
				placeholder='e.g. Customer Records'
			/>

			<div className='border border-gray-300 p-4'>
				<div className='flex w-full items-center'>
					<div className='w-1/2'>
						<div>Data Storage Region</div>
						<div className='text-gray-500'>
							Default region is set by the team creator, you select a different one
						</div>
					</div>
					<div className='w-1/2'>
						<SelectField<DataSourceDetailsFormValues>
							name='region'
							control={control}
							rules={{
								required: 'Region is required'
							}}
							options={[
								{ label: 'US', value: 'us' },
								{ label: 'Canada', value: 'ca' },
								{ label: 'United Kingdom', value: 'uk' },
								{ label: 'Australia', value: 'au' },
								{ label: 'Germany', value: 'de' },
								{ label: 'France', value: 'fr' },
								{ label: 'India', value: 'in' },
								{ label: 'Japan', value: 'jp' },
								{ label: 'Brazil', value: 'br' },
								{ label: 'Mexico', value: 'mx' }
							]}
							placeholder='Select a region...'
							optionLabel={OptionLabel}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DataSourceDetails;

const OptionLabel = (data: Option) => {
	return (
		<div className='flex items-center gap-x-2'>
			<div className='text-sm font-medium text-gray-900'>{data.label}</div>
			<div className='text-xs text-gray-500'>{data.value}</div>
		</div>
	);
};
