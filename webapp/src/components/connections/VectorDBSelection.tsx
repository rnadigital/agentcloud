import * as API from '@api';
import {
	CheckCircleIcon,
	CubeIcon,
	StarIcon,
	XCircleIcon,
	XMarkIcon
} from '@heroicons/react/24/outline';
import ButtonSpinner from 'components/ButtonSpinner';
import InputField from 'components/form/InputField';
import SelectField from 'components/form/SelectField';
import formatModelOptionLabel from 'components/FormatModelOptionLabel';
import { useAccountContext } from 'context/account';
import { useOnboardingFormContext } from 'context/onboardingform';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from 'modules/components/ui/select';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import { Control, useForm, UseFormSetValue } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useDatasourceStore } from 'store/datasource';
import { StreamConfig } from 'struct/datasource';
import { VectorDb } from 'struct/vectordb';
import { Cloud, CloudRegionMap, Region } from 'struct/vectorproxy';
import SelectClassNames from 'styles/SelectClassNames';
import cn from 'utils/cn';

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
	index?: string;
	region?: Region;
	cloud?: Cloud;
}

const VectorDBSelection = () => {
	const { control, setValue, watch, handleSubmit } = useOnboardingFormContext<any>();
	const [loading, setLoading] = useState(false);
	const [selectedExistingDb, setSelectedExistingDb] = useState<string>();

	const setStep = useDatasourceStore(state => state.setCurrentStep);
	const streamState = useDatasourceStore(state => state.streamState);
	const chunkingConfig = useDatasourceStore(state => state.chunkingConfig);
	const stagedDatasource = useDatasourceStore(state => state.stagedDatasource);
	const embeddingField = useDatasourceStore(state => state.embeddingField);
	const fetchVectorDbs = useDatasourceStore(state => state.fetchVectorDbs);
	const vectorDbs = useDatasourceStore(state => state.vectorDbs);

	const datasourceId = stagedDatasource?.datasourceId;

	const modelId = watch('modelId');
	const scheduleType = watch('scheduleType');
	const timeUnit = watch('timeUnit');
	const units = watch('units');
	const cronExpression = watch('cronExpression');
	const datasourceName = watch('datasourceName');
	const datasourceDescription = watch('datasourceDescription');
	const retriever = watch('retrievalStrategy');
	const toolDecayRate = watch('toolDecayRate');
	const toolTimeWeightField = watch('toolTimeWeightField');
	const topK = watch('topK');
	const enableConnectorChunking = watch('enableConnectorChunking');
	const byoVectorDb = watch('byoVectorDb');
	const collectionName = watch('index');
	const connector = watch('connector');
	const cloud = watch('cloud');
	const region = watch('region');

	const [selectedDB, setSelectedDB] = useState<string>();

	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const { setCurrentStep } = useDatasourceStore();

	const router = useRouter();
	const { resourceSlug } = router.query;

	const posthog = usePostHog();

	const addDatasource = async (vectorDbId?: string) => {
		const filteredStreamState = Object.entries(streamState).filter(
			(e: [string, StreamConfig]) => e[1].checkedChildren.length > 0
		);
		const body = {
			_csrf: csrf,
			datasourceId: datasourceId,
			resourceSlug,
			scheduleType,
			timeUnit,
			units,
			modelId,
			cronExpression,
			streamConfig: filteredStreamState,
			datasourceName,
			datasourceDescription,
			embeddingField,
			retriever,
			retriever_config: {
				timeWeightField: toolTimeWeightField,
				decay_rate: toolDecayRate,
				k: topK
			},
			chunkingConfig,
			enableConnectorChunking,
			vectorDbId: vectorDbId || selectedExistingDb || undefined,
			byoVectorDb,
			collectionName,
			noRedirect: true,
			cloud,
			region
		};
		await API.addDatasource(
			body,
			() => {
				posthog.capture('createDatasource', {
					datasourceName,
					connectorId: connector?.value,
					connectorName: connector?.label,
					numStreams: Object.keys(streamState)?.length,
					syncSchedule: scheduleType
				});
				toast.success('Added datasource');
			},
			res => {
				posthog.capture('createDatasource', {
					datasourceName,
					connectorId: connector?.value,
					connectorName: connector?.label,
					syncSchedule: scheduleType,
					numStreams: Object.keys(streamState)?.length,
					error: res
				});
				toast.error(res);
			},
			router
		);
	};

	const onSubmit = async (data: any) => {
		setLoading(true);
		if (data.byoVectorDb) {
			await API.addVectorDb(
				{ _csrf: csrf, resourceSlug, ...data, type: selectedDB },
				async res => {
					// callback?.({ label: data.name, value: res._id });
					toast.success('VectorDb Added');
					await addDatasource(res._id);
					await API.markOnboarded({ _csrf: csrf }, null, null, router);
					setLoading(false);
					setStep(3);

					// create datasource
				},
				res => {
					toast.error(res);
				},
				null
			);
		} else {
			await addDatasource(selectedDB === 'agent-cloud' ? undefined : selectedExistingDb);
			await API.markOnboarded({ _csrf: csrf }, null, null, router);
			setLoading(false);
			setStep(3);
		}
	};

	useEffect(() => {
		if (selectedDB) {
			setValue('url', '');
			setValue('apiKey', '');
			setValue('cloud', Cloud.AWS);
		}
	}, [selectedDB]);

	useEffect(() => {
		if (resourceSlug) {
			fetchVectorDbs(router);
		}
	}, [router, resourceSlug]);

	return (
		<form className='flex flex-wrap' onSubmit={handleSubmit(onSubmit)}>
			<div className='w-full mb-6 flex flex-col'>
				<div className='text-sm font-medium mb-2'>Select existing Vector DB</div>
				<Select
					value={selectedExistingDb}
					onValueChange={value => {
						if (value === '_empty') {
							setSelectedExistingDb(null);
							setValue('byoVectorDb', false);
							setSelectedDB(null);
						} else {
							setSelectedExistingDb(value);
							setValue('byoVectorDb', false);
							setSelectedDB(null);
						}
					}}>
					<SelectTrigger>
						<SelectValue placeholder='Select a vector database' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='_empty'>Clear selection</SelectItem>
						{vectorDbs.map(db => (
							<SelectItem key={db._id} value={db._id}>
								{db.name} ({db.type})
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<div className='text-sm text-gray-500 mt-2'>Or create a new vector database below</div>
			</div>

			{!selectedExistingDb &&
				options.map((connector, index) => (
					<button
						type='button'
						key={connector.name}
						className={cn(
							'border-gray-200 border flex flex-col justify-center items-center h-44 w-1/3 relative',
							{ 'bg-primary-50 border-0': selectedDB === connector.value }
						)}
						onClick={() => {
							setSelectedDB(connector.value);
							if (connector.value !== 'agent-cloud') {
								setValue('byoVectorDb', true);
							} else {
								setValue('byoVectorDb', false);
							}
						}}>
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
				<PineConeFields
					setSelectedDB={setSelectedDB}
					control={control}
					setValue={setValue}
					cloud={cloud}
				/>
			)}
			{selectedDB === 'qdrant' && (
				<QdrantFields setSelectedDB={setSelectedDB} control={control} setValue={setValue} />
			)}
			{selectedDB === 'agent-cloud' && <AgentCloudFields control={control} cloud={cloud} />}

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

			<div className='flex justify-end mt-4 ml-auto'>
				<button
					type='submit'
					className='rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center justify-center'>
					{loading && <ButtonSpinner />}
					{loading ? 'Saving Datasource ...' : 'Continue'}
				</button>
			</div>
		</form>
	);
};

export default VectorDBSelection;

const AgentCloudFields = ({ control, cloud }: { control: Control<FormValues>; cloud?: string }) => {
	return (
		<div className='w-full bg-primary-50 flex flex-col text-gray-500'>
			<div className='px-8 mt-4 pb-12'>
				<div className='my-2 text-sm'>Cloud Provider</div>
				<SelectField<FormValues>
					name='cloud'
					control={control}
					rules={{
						required: 'Cloud provider is required'
					}}
					options={Object.values(Cloud).map(option => ({
						label: option,
						value: option
					}))}
					placeholder='Select a cloud provider...'
					optionLabel={formatModelOptionLabel}
				/>

				<div className='my-2 text-sm'>Region</div>
				<SelectField<FormValues>
					name='region'
					control={control}
					rules={{
						required: 'Region is required'
					}}
					options={
						cloud ? CloudRegionMap[cloud]?.map(option => ({ label: option, value: option })) : []
					}
					placeholder='Select a region...'
					optionLabel={formatModelOptionLabel}
				/>
			</div>
		</div>
	);
};

const PineConeFields = ({
	setSelectedDB,
	control,
	setValue,
	cloud
}: {
	setSelectedDB: Function;
	control: Control<FormValues>;
	setValue: UseFormSetValue<FormValues>;
	cloud?: string;
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
					type='button'
					className='bg-white w-full flex p-4 items-center'
					onClick={() => connectWithAPIKey()}>
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

				<div>
					<div className='my-2 text-sm'>Index</div>
					<InputField<FormValues>
						name='index'
						control={control}
						rules={{
							required: 'Index is required'
						}}
						type='text'
						placeholder='Enter the index to use'
					/>
				</div>

				<div className='my-2 text-sm'>Cloud Provider</div>
				<SelectField<FormValues>
					name='cloud'
					control={control}
					rules={{
						required: 'Cloud provider is required'
					}}
					options={Object.values(Cloud).map(option => ({
						label: option,
						value: option
					}))}
					placeholder='Select a cloud provider...'
					optionLabel={formatModelOptionLabel}
				/>

				<div className='my-2 text-sm'>Region</div>
				<SelectField<FormValues>
					name='region'
					control={control}
					rules={{
						required: 'Region is required'
					}}
					options={
						cloud ? CloudRegionMap[cloud]?.map(option => ({ label: option, value: option })) : []
					}
					placeholder='Select a region...'
					optionLabel={formatModelOptionLabel}
				/>

				<div>
					<div className='my-2 text-sm'>Name</div>
					<InputField<FormValues>
						name='name'
						control={control}
						rules={{
							required: 'Name is required'
						}}
						type='text'
						placeholder='Enter your vector DB name'
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
						required: 'URL is required',

						pattern: {
							value: /:6334$/,
							message: 'Ensure that the url has :6334 at the end'
						}
					}}
					type='text'
					placeholder='https://07a585e7-5a33-48bd-92a0-3bd14bf8b8ee.eu-west-2-0.aws.cloud.qdrant.io:6334'
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
				<div className='my-2 text-sm'>Name</div>
				<InputField<FormValues>
					name='name'
					control={control}
					rules={{
						required: 'Name is required'
					}}
					type='text'
					placeholder='Enter your vector DB name'
				/>
			</div>
		</div>
	);
};
