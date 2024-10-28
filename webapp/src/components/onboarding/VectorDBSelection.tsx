import {
	CheckCircleIcon,
	CubeIcon,
	StarIcon,
	XCircleIcon,
	XMarkIcon
} from '@heroicons/react/24/outline';
import InputField from 'components/form/InputField';
import SelectField from 'components/form/SelectField';
import cn from 'lib/cn';
import React, { useEffect, useState } from 'react';
import { Control, useForm, UseFormSetValue } from 'react-hook-form';

const options = [
	{
		name: 'Pinecone',
		icon: <img src='/images/vector-db/pinecone.png' className='h-6 w-6' />,
		value: 'pinecone'
	},
	{
		name: 'Qdrant',
		icon: <img src='/images/vector-db/qdrant.png' className='h-6 w-6' />,
		value: 'qdrant'
	},
	{
		name: "Agent Cloud's Vector DB",
		icon: <CubeIcon className='h-8 w-8 text-primary-500' />,
		value: 'agent-cloud'
	}
];

const unavailableOptions = [
	{
		name: 'Chroma',
		value: 'chroma'
	}
];

interface FormValues {
	apiKey: string;
	url?: string;
	name: string;
	type: string;
	preferredVectorDB?: string;
}

const VectorDBSelection = () => {
	const { control, register, setValue } = useForm<FormValues>();

	const [selectedDB, setSelectedDB] = useState<string>();

	useEffect(() => {
		if (selectedDB) {
			setValue('url', '');
			setValue('apiKey', '');
		}
	}, [selectedDB]);

	return (
		<div className='flex flex-wrap'>
			{options.map((connector, index) => (
				<button
					key={connector.name}
					className={cn(
						'border-gray-200 border flex flex-col justify-center items-center h-44 w-1/3 relative',
						{ 'bg-primary-50 border-0': selectedDB === connector.value }
					)}
					onClick={() => setSelectedDB(connector.value)}
				>
					{connector.value === selectedDB && (
						<CheckCircleIcon className='h-8 w-8 text-primary-500 absolute top-4 right-4' />
					)}
					{connector.icon}
					<span className='mt-2'>{connector.name}</span>
					{connector.value === 'agent-cloud' && (
						<div className='flex gap-2 items-center bg-gradient-to-r from-[#4F46E5] to-[#612D89] rounded-full text-white px-4 py-1 mt-2'>
							<StarIcon className='h-4 w-4' />
							<div>Easy set up!</div>
						</div>
					)}
				</button>
			))}

			{selectedDB === 'pinecone' && (
				<PineConeFields setSelectedDB={setSelectedDB} control={control} setValue={setValue} />
			)}
			{selectedDB === 'qdrant' && (
				<QdrantFields setSelectedDB={setSelectedDB} control={control} setValue={setValue} />
			)}

			{!selectedDB && (
				<div className='border-gray-200 border flex justify-center items-center h-44 w-full px-4'>
					<div className='flex flex-col'>
						<span className='font-semibold'> Don&apos;t see your preferred vector DB here?</span>
						<span className=''>
							Let us know which one you need and we&apos;ll reach out as soon as it&apos;s
							available.
						</span>
					</div>
					<SelectField<FormValues>
						name='preferredVectorDB'
						control={control}
						rules={{
							required: 'Vector DB is required'
						}}
						options={unavailableOptions.map(option => ({ label: option.name, value: option.name }))}
						placeholder='Select a vector DB...'
					/>
				</div>
			)}
		</div>
	);
};

export default VectorDBSelection;

const PineConeFields = ({
	setSelectedDB,
	control,
	setValue
}: {
	setSelectedDB: Function;
	control: Control<FormValues>;
	setValue: UseFormSetValue<FormValues>;
}) => {
	const connectWithAPIKey = async () => {
		const { ConnectPopup } = await import('@pinecone-database/connect'); // Dynamic import
		/* Call ConnectPopup function with an object containing options */
		ConnectPopup({
			onConnect: key => {
				setValue('apiKey', key.key);
			},
			integrationId: 'ian'
		}).open();
	};

	return (
		<div className='w-full bg-primary-50 flex flex-col text-gray-500'>
			<div className='ml-auto'>
				<XCircleIcon
					className='h-6 w-6 text-gray-500 mr-2 mt-2 cursor-pointer'
					onClick={() => setSelectedDB(null)}
				/>
			</div>
			<div className='px-8 mt-4 pb-12'>
				<button
					className='bg-white w-full flex p-4 items-center'
					onClick={() => connectWithAPIKey()}
				>
					<span className='text-sm font-medium'>Connect Securely with Pinecone</span>
					<div className='px-5 py-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white rounded-md ml-auto'>
						Connect{' '}
					</div>
				</button>
				<div className='my-4 flex justify-center text-sm'>or</div>
				<div>
					<div className='mb-2 text-sm'>Connect with API key</div>
					<InputField<FormValues>
						name='apiKey'
						control={control}
						rules={{
							required: 'API key is required'
						}}
						type='text'
						placeholder='Enter your API key'
					/>
				</div>
			</div>
		</div>
	);
};

const QdrantFields = ({
	setSelectedDB,
	control,
	setValue
}: {
	setSelectedDB: Function;
	control: Control<FormValues>;
	setValue: UseFormSetValue<FormValues>;
}) => {
	const connectWithAPIKey = async () => {
		const { ConnectPopup } = await import('@pinecone-database/connect'); // Dynamic import
		/* Call ConnectPopup function with an object containing options */
		ConnectPopup({
			onConnect: key => {
				setValue('apiKey', key.key);
			},
			integrationId: 'ian'
		}).open();
	};

	return (
		<div className='w-full bg-primary-50 flex flex-col text-gray-500'>
			<div className='ml-auto'>
				<XCircleIcon
					className='h-6 w-6 text-gray-500 mr-2 mt-2 cursor-pointer'
					onClick={() => setSelectedDB(null)}
				/>
			</div>
			<div className='px-8 mt-4 pb-12'>
				<div className='mb-2 text-sm'>Qdrant URL</div>
				<InputField<FormValues>
					name='url'
					control={control}
					rules={{
						required: 'URL is required'
					}}
					type='text'
					placeholder='Enter Qdrant URL'
				/>
				<div className='mb-2 text-sm mt-4'>Connect with API key</div>
				<InputField<FormValues>
					name='apiKey'
					control={control}
					rules={{
						required: 'API key is required'
					}}
					type='text'
					placeholder='Enter your API key'
				/>
			</div>
		</div>
	);
};
