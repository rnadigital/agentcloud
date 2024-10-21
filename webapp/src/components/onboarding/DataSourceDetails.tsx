import { UserPlusIcon } from '@heroicons/react/24/outline';
import InputField from 'components/form/InputField';
import SelectField from 'components/form/SelectField';
import { useOnboardinFormContext } from 'context/onboardingform';
import { AU, BR, CA, EU, FlagComponent, JP, SG, US } from 'country-flag-icons/react/3x2';
import React from 'react';
import { Option } from 'react-tailwindcss-select/dist/components/type';

interface DataSourceDetailsFormValues {
	connectionName: string;
	region: string;
	chunkStrategy: string;
	retrievalStrategy: string;
	k: number;
}

const regionOptions: { label: string; value: string; region: FlagComponent }[] = [
	{ label: 'US East (Virginia)', value: 'us-east-1', region: US },
	{ label: 'US West (Oregon)', value: 'us-west-2', region: US },
	{ label: 'US West (N. California)', value: 'us-west-1', region: US },
	{ label: 'EU (Ireland)', value: 'eu-west-1', region: EU },
	{ label: 'EU (Frankfurt)', value: 'eu-central-1', region: EU },
	{ label: 'Asia Pacific (Tokyo)', value: 'ap-northeast-1', region: JP },
	{ label: 'Asia Pacific (Sydney)', value: 'ap-southeast-2', region: AU },
	{ label: 'Asia Pacific (Singapore)', value: 'ap-southeast-1', region: SG },
	{ label: 'South America (São Paulo)', value: 'sa-east-1', region: BR },
	{ label: 'Canada (Central)', value: 'ca-central-1', region: CA }
];

const DataSourceDetails = () => {
	const { control, getValues } = useOnboardinFormContext<DataSourceDetailsFormValues>();

	const k = getValues('k');

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

			<div className='border border-gray-300 p-4 flex flex-col gap-y-10 mt-6'>
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
							options={regionOptions.map(option => ({ label: option.label, value: option.value }))}
							placeholder='Select a region...'
							optionLabel={RegionOptionLabel}
						/>
					</div>
				</div>

				<div className='flex w-full items-center'>
					<div className='w-1/2'>
						<div>Chunk Strategy</div>
						<div className='text-gray-500'>
							Default region is set by the team creator, you select a different one
						</div>
					</div>
					<div className='w-1/2'>
						<SelectField<DataSourceDetailsFormValues>
							name='chunkStrategy'
							control={control}
							rules={{
								required: 'Chunking strategyis required'
							}}
							options={[
								{ label: 'Semantic', value: 'semantic' },
								{ label: 'Syntactic', value: 'syntactic' },
								{ label: 'Statistical', value: 'statistical' },
								{ label: 'Rule-based', value: 'rule_based' }
							]}
							placeholder='Select a chunking strategy...'
						/>
					</div>
				</div>

				<div className='flex w-full items-center'>
					<div className='w-1/2'>
						<div>Retrieval Strategy</div>
						<div className='text-gray-500'>
							Determines how to find and retrieve relevant data from the chunks.
						</div>
					</div>
					<div className='w-1/2'>
						<SelectField<DataSourceDetailsFormValues>
							name='retrievalStrategy'
							control={control}
							rules={{
								required: 'Retrieval strategy is required'
							}}
							options={[
								{ label: 'Vector Search', value: 'vector_search' },
								{ label: 'Nearest Neighbor', value: 'nearest_neighbor' },
								{ label: 'Hybrid Search', value: 'hybrid_search' },
								{ label: 'Content-based Retrieval', value: 'content_based' }
							]}
							placeholder='Select a retrieval strategy...'
						/>
					</div>
				</div>

				<div className='flex w-full items-center'>
					<div className='w-1/2'>
						<div>Top K Results</div>
						<div className='text-gray-500'>
							Specify how many of the top results to return from your query.
						</div>
					</div>
					<div className='w-1/2'>
						<InputField<DataSourceDetailsFormValues>
							name='k'
							control={control}
							rules={{
								required: 'Tok K Results is required'
							}}
							placeholder='5'
							type='number'
						/>

						{k >= 10 && (
							<div className='bg-orange-50 rounded-md p-4 text-sm text-orange-800'>
								Selecting values greater 10 can slow queries and increase token costs due to the
								larger data volume
							</div>
						)}
					</div>
				</div>

				<div className='flex bg-primary-50 items-center p-2 rounded-lg gap-2'>
					<UserPlusIcon className='h-4 w-4 text-primary-500' />
					<span className='text-xs text-primary-900'>Not sure how to configure this page?</span>
					<button className='text-xs text-primary-500 ml-auto'> Invite a Developer!</button>
				</div>
			</div>
		</div>
	);
};

export default DataSourceDetails;

const RegionOptionLabel = (data: Option) => {
	const option = regionOptions.find(option => option.value === data.value);

	return (
		<div className='flex items-center gap-x-2 cursor-pointer h-8'>
			<option.region className='h-4 w-4' />
			<div className='text-sm font-medium text-gray-900'>{data.label}</div>
			<div className='text-xs text-gray-500'>{data.value}</div>
		</div>
	);
};
