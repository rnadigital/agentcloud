import * as API from '@api';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import InputField from 'components/form/InputField';
import ToolTip from 'components/shared/ToolTip';
import { useAccountContext } from 'context/account';
import { useOnboardingFormContext } from 'context/onboardingform';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ModelEmbeddingLength, ModelList, modelOptions, ModelTypeRequirements } from 'struct/model';

import OnboardingSelect from './OnboardingSelect';
import { useDatasourceStore } from 'store/datasource';
import { useShallow } from 'zustand/react/shallow';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from 'modules/components/ui/select';

interface LLMOption {
	label: string;
	value: string;
	iconURL?: string;
	recommended?: boolean;
}

interface LLMConfigurationFormValues {
	embeddingType: LLMOption;
	embeddingModel: LLMOption;
	embeddedModelConfig: Record<string, string>;
	apiKey?: string;
	modelId?: string;
}

const EmbeddingModelSelect = () => {
	const { teamModels, setStep, fetchTeamModels } = useDatasourceStore(
		useShallow(state => ({
			teamModels: state.teamModels,
			setStep: state.setCurrentStep,
			fetchTeamModels: state.fetchTeamModels
		}))
	);

	const { control, watch, setValue, resetField, handleSubmit } =
		useOnboardingFormContext<LLMConfigurationFormValues>();

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext;

	const router = useRouter();
	const posthog = usePostHog();

	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;

	const embeddingType = watch('embeddingType');
	const embeddingModelList = [
		{ label: null, value: null },
		...((ModelList[embeddingType?.value] || [])
			.filter(model => ModelEmbeddingLength[model])
			.filter(m => {
				if (process.env.NEXT_PUBLIC_GCS_BUCKET_NAME === 'agentcloud-public') {
					return !ModelEmbeddingLength[m] || ModelEmbeddingLength[m] === 1536;
				}
				return true;
			})
			.map(model => ({
				label: model,
				value: model,
				...(model === 'text-embedding-3-small' ? { recommended: true } : {})
			})) || [])
	];

	const EmbeddingModelRequiredFields =
		embeddingType?.value &&
		Object.keys(ModelTypeRequirements[embeddingType.value])
			.filter(key => !ModelTypeRequirements[embeddingType.value][key].optional)
			.map(key => {
				const label = key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
				const placeholder = key.endsWith('key') ? 'Paste your API key' : `Enter the ${label}`;
				return { name: `embeddedModelConfig.${key}`, label, placeholder };
			});

	const [userSelectedEmbeddingType, setUserSelectedEmbeddingType] = useState(false);

	const handleSetUserSelectedEmbeddingType = () => {
		setUserSelectedEmbeddingType(true);
	};

	const addNewModel = async (data: LLMConfigurationFormValues) => {
		const embeddingBody = {
			_csrf: csrf,
			resourceSlug,
			name: data.embeddingType.label,
			model: data.embeddingModel.value,
			type: data.embeddingType.value,
			config: {
				...data.embeddedModelConfig,
				model: data.embeddingModel.value
			}
		};

		await API.addModel(embeddingBody, null, res => toast.error(res), null).then(addedModel => {
			setValue('modelId', addedModel._id);
		});
		setStep(2);
	};

	const [selectedTeamModel, setSelectedTeamModel] = useState('');

	const existingModelOptions = teamModels
		?.filter(model => ModelEmbeddingLength[model.model])
		.map(model => ({
			value: model._id,
			label: model.name,
			model: model.model
		}));

	useEffect(() => {
		if (selectedTeamModel) {
			const selectedModel = teamModels.find(m => m._id.toString() === selectedTeamModel);
			if (selectedModel) {
				setValue('modelId', selectedModel._id.toString());
				setStep(2);
			}
		}
	}, [selectedTeamModel]);

	useEffect(() => {
		setValue('embeddingModel', {
			label: 'text-embedding-3-small',
			value: 'text-embedding-3-small'
		});
		setValue('embeddingType', modelOptions[0]);
	}, []);

	useEffect(() => {
		if (embeddingType && userSelectedEmbeddingType) {
			resetField('embeddingModel', {
				defaultValue: { label: null, value: null }
			});
			setUserSelectedEmbeddingType(false);
		}
	}, [embeddingType]);

	useEffect(() => {
		if (resourceSlug) {
			fetchTeamModels(router);
		}
	}, [router, resourceSlug]);

	return (
		<form
			className='flex-1 border border-gray-300 p-4 flex flex-col gap-y-3 mt-6'
			onSubmit={handleSubmit(addNewModel)}
		>
			<div className='text-sm flex gap-1 dark:text-white mb-4'>
				<span>Use Existing Model</span>
				<ToolTip content='Select an existing embedding model from your team'>
					<span className='cursor-pointer'>
						<InformationCircleIcon className='h-4 w-4 text-gray-400' />
					</span>
				</ToolTip>
			</div>

			<Select value={selectedTeamModel} onValueChange={setSelectedTeamModel}>
				<SelectTrigger className='w-full'>
					<SelectValue placeholder='Select an existing model' />
				</SelectTrigger>
				<SelectContent>
					{existingModelOptions?.map(option => (
						<SelectItem key={option.value.toString()} value={option.value.toString()}>
							{option.label} ({option.model})
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<div className='my-4'>
				<div className='relative'>
					<div className='absolute inset-0 flex items-center'>
						<span className='w-full border-t border-gray-300' />
					</div>
					<div className='relative flex justify-center text-sm'>
						<span className='px-2 bg-white text-gray-500 dark:bg-gray-800'>
							Or create new model
						</span>
					</div>
				</div>
			</div>

			<div className='text-sm flex gap-1 dark:text-white'>
				<span>Select Embedding</span>
				<ToolTip content='Embedding models convert text or other data into numerical vectors for analysis and machine learning tasks. Use them for similarity searches, clustering, recommendation systems, and more. Embedding models are used to embed data and store it in a vector database for later RAG retrieval.'>
					<span className='cursor-pointer'>
						<InformationCircleIcon className='h-4 w-4 text-gray-400' />
					</span>
				</ToolTip>
			</div>
			<div className='flex'>
				<div className='w-1/2 sm:w-2/5'>
					<OnboardingSelect<LLMConfigurationFormValues>
						options={modelOptions}
						classNames={{
							listboxButton: 'rounded-l-md bg-gray-100 dark:bg-gray-600',
							listboxOptions: 'left-0'
						}}
						control={control}
						name='embeddingType'
						callback={handleSetUserSelectedEmbeddingType}
					/>
				</div>
				<div className='w-1/2 sm:flex-1'>
					<OnboardingSelect<LLMConfigurationFormValues>
						options={embeddingModelList}
						classNames={{
							listboxButton: 'rounded-r-md bg-gray-50 dark:bg-gray-700',
							listboxOptions: 'right-0'
						}}
						control={control}
						name='embeddingModel'
					/>
				</div>
			</div>
			<div className='mt-2'>
				{EmbeddingModelRequiredFields &&
					EmbeddingModelRequiredFields.length > 0 &&
					EmbeddingModelRequiredFields.map(field => (
						<div key={field.name}>
							<InputField<LLMConfigurationFormValues>
								name={field.name as keyof LLMConfigurationFormValues}
								rules={{
									required: `${field.label} is required`
								}}
								label={field.label}
								type='text'
								control={control}
								placeholder={field.placeholder}
							/>
						</div>
					))}
			</div>

			<div className='flex justify-end mt-4'>
				<button
					type='submit'
					className='rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
				>
					Continue
				</button>
			</div>
		</form>
	);
};

export default EmbeddingModelSelect;
