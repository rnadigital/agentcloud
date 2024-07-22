import * as API from '@api';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { InformationCircleIcon } from '@heroicons/react/20/solid';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import ButtonSpinner from 'components/ButtonSpinner';
import InputField from 'components/form/InputField';
import ToolTip from 'components/shared/ToolTip';
import { useAccountContext } from 'context/account';
import useResponsive from 'hooks/useResponsive';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
	ModelEmbeddingLength,
	ModelList,
	modelOptions,
	ModelType,
	ModelTypeRequirements
} from 'struct/model';

import OnboardingSelect from './OnboardingSelect';

interface LLMOption {
	label: string;
	value: string;
	iconURL?: string;
	recommended?: boolean;
}

interface LLMConfigurationFormValues {
	LLMType: LLMOption;
	LLMModel: LLMOption;
	api_key: string;
	embedding_api_key: string;
	embedding_cohre_api_key: string;
	embedding_groq_api_key: string;
	embeddingType: LLMOption;
	embeddingModel: LLMOption;
	base_url: string;
	cohere_api_key: string;
	groq_api_key: string;
	embedding_base_url: string;
}

const LLMConfigurationForm = () => {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext;
	console.log(csrf);
	const router = useRouter();
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;

	const [isMounted, setIsMounted] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const { control, watch, resetField, handleSubmit } = useForm<LLMConfigurationFormValues>({
		defaultValues: { LLMType: modelOptions[0], embeddingType: modelOptions[0] }
	});

	const { LLMType, embeddingType, LLMModel, embeddingModel } = watch();

	const modelList =
		[
			{ label: null, value: null },
			...ModelList[LLMType.value]
				.filter(model => !ModelEmbeddingLength[model])
				.map(model => ({
					label: model,
					value: model,
					...(model === 'gpt-4o' ? { recommended: true } : {})
				}))
		] || [];
	const embeddingModelList =
		[
			{ label: null, value: null },
			...ModelList[embeddingType?.value]
				.filter(model => ModelEmbeddingLength[model])
				.map(model => ({ label: model, value: model }))
		] || [];

	const isOpenAISelectedLLMType = LLMType.value === ModelType.OPENAI;
	const isOpenAISelectedEmbeddingType = embeddingType.value === ModelType.OPENAI;

	// const embeddingAPIKeyValue = embeddingAPIKey && embeddingAPIKey.startsWith('sk-') && embeddingAPIKey.length > 10
	// 	? `${embeddingAPIKey.substring(0, 3)}${'X'.repeat(embeddingAPIKey.length - 3)}`
	// 	: embeddingAPIKey;

	// const llmAPIKeyValue = llmAPIKey && llmAPIKey.startsWith('sk-') && llmAPIKey.length > 10
	// 	? `${llmAPIKey.substring(0, 3)}${'X'.repeat(llmAPIKey.length - 3)}`
	// 	: llmAPIKey;

	const LLMModelRequiredFields = Object.keys(ModelTypeRequirements[LLMType.value])
		.filter(key => !ModelTypeRequirements[LLMType.value][key].optional)
		.map(key => {
			const label = key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
			const placeholder = key.endsWith('key') ? 'Paste your API key' : `Enter the ${label}`;
			return { name: key, label, placeholder };
		});

	const EmbeddingModelRequiredFields = Object.keys(ModelTypeRequirements[embeddingType?.value])
		.filter(key => !ModelTypeRequirements[embeddingType?.value][key].optional)
		.map(key => {
			const label = key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
			const placeholder = key.endsWith('key') ? 'Paste your API key' : `Enter the ${label}`;
			return { name: `embedding_${key}`, label, placeholder };
		});

	const { isTablet, isMobile } = useResponsive();

	const onSubmit = async (data: LLMConfigurationFormValues) => {
		setSubmitting(true);
		if (data.LLMModel) {
			const body = {
				_csrf: csrf,
				resourceSlug,
				name: data.LLMType.label,
				model: data.LLMModel.value,
				type: data.LLMType.value,
				config: {
					model: data.LLMModel.value,
					...(data.api_key && { api_key: data.api_key }),
					...(data.groq_api_key && { groq_api_key: data.groq_api_key }),
					...(data.cohere_api_key && { cohere_api_key: data.cohere_api_key }),
					...(data.base_url && { base_url: data.base_url })
				}
			};

			await API.addModel(
				body,
				() => {
					toast.success('Added Model');
				},
				res => {
					toast.error(res);
				},
				null
			);
		}

		if (data.embeddingModel) {
			const body = {
				_csrf: csrf,
				resourceSlug,
				name: data.embeddingType.label,
				model: data.embeddingModel.value,
				type: data.embeddingType.value,
				config: {
					model: data.embeddingModel.value,
					...(data.embedding_api_key && { api_key: data.embedding_api_key }),
					...(data.embedding_cohre_api_key && { cohre_api_key: data.embedding_cohre_api_key }),
					...(data.embedding_groq_api_key && { groq_api_key: data.embedding_groq_api_key }),
					...(data.embedding_base_url && { base_url: data.embedding_base_url })
				}
			};
			await API.addModel(
				body,
				() => {
					toast.success('Added Model');
				},
				res => {
					toast.error(res);
				},
				null
			);
		}

		await API.updateOnboardedStatus({}, null, null, router);
		setSubmitting(false);
	};

	const updateOnboardedStatus = async () => {
		setSubmitting(true);
		try {
			await API.updateOnboardedStatus({}, null, null, router);
		} finally {
			setSubmitting(false);
		}
	};

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (LLMType) {
			resetField('LLMModel');
		}
	}, [LLMType]);

	useEffect(() => {
		if (embeddingType) {
			resetField('embeddingModel');
		}
	}, [embeddingType]);

	if (!isMounted) {
		return null;
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<div className='mt-14 flex gap-8 flex-col md:flex-row'>
				<div className='flex-1'>
					<div className='text-sm flex gap-1'>
						<span>Select LLM</span>
						<ToolTip content='Hello world'>
							<span className='cursor-pointer'>
								<InformationCircleIcon className='h-4 w-4 text-gray-400' />
							</span>
						</ToolTip>
					</div>
					<div className='flex'>
						<div className='w-1/2 sm:w-2/5'>
							<OnboardingSelect<LLMConfigurationFormValues>
								options={modelOptions}
								classNames={{ listboxButton: 'rounded-l-md bg-gray-100', listboxOptions: 'left-0' }}
								control={control}
								name='LLMType'
							/>
						</div>
						<div className='w-1/2 sm:flex-1'>
							<OnboardingSelect<LLMConfigurationFormValues>
								options={modelList}
								classNames={{ listboxButton: 'rounded-r-md bg-gray-50', listboxOptions: 'right-0' }}
								control={control}
								name='LLMModel'
							/>
						</div>
					</div>

					<div
						className={clsx(
							'flex gap-2 bg-primary-50 text-primary-800 text-xs mt-2 min-h-8 justify-start items-center rounded-md ml-1 p-1',
							{ 'bg-white': !isOpenAISelectedLLMType }
						)}
					>
						{isOpenAISelectedLLMType && (
							<>
								<CheckBadgeIcon className='h-6 w-6' />
								<div>Best for overall speed, cost, performance, and tool integration</div>
							</>
						)}
					</div>

					{isMobile && (
						<div className='mt-2'>
							{LLMModelRequiredFields.length > 0 &&
								LLMModelRequiredFields.map(field => (
									<div key={field.name} className='mt-2'>
										<InputField<LLMConfigurationFormValues>
											name={field.name as keyof LLMConfigurationFormValues}
											rules={{ required: LLMModel?.value ? `${field.label} is required` : false }}
											label={field.label}
											type='text'
											control={control}
											placeholder={field.placeholder}
											disabled={!LLMModel || !LLMModel.value}
										/>
									</div>
								))}
						</div>
					)}
				</div>

				<div className='flex-1'>
					<div className='text-sm flex gap-1'>
						<span>Select Embedding</span>
						<ToolTip content='Embedding models are used to when storing your data into the vector DB and by the Agent for RAG retrieval'>
							<span className='cursor-pointer'>
								<InformationCircleIcon className='h-4 w-4 text-gray-400' />
							</span>
						</ToolTip>
					</div>
					<div className='flex'>
						<div className='w-1/2 sm:w-2/5'>
							<OnboardingSelect<LLMConfigurationFormValues>
								options={modelOptions}
								classNames={{ listboxButton: 'rounded-l-md bg-gray-100', listboxOptions: 'left-0' }}
								control={control}
								name='embeddingType'
							/>
						</div>
						<div className='w-1/2 sm:flex-1'>
							<OnboardingSelect<LLMConfigurationFormValues>
								options={embeddingModelList}
								classNames={{ listboxButton: 'rounded-r-md bg-gray-50', listboxOptions: 'right-0' }}
								control={control}
								name='embeddingModel'
							/>
						</div>
					</div>

					<div
						className={clsx(
							'flex gap-2 bg-primary-50 text-primary-800 text-xs mt-2 min-h-8 justify-start items-center rounded-md ml-1 p-1',
							{ 'bg-white': !isOpenAISelectedEmbeddingType }
						)}
					>
						{isOpenAISelectedEmbeddingType && (
							<>
								<CheckBadgeIcon className='h-6 w-6' />
								<div>Excellent for RAG, with great cost efficiency and performance.</div>
							</>
						)}
					</div>

					{isMobile &&
						EmbeddingModelRequiredFields.length > 0 &&
						EmbeddingModelRequiredFields.map(field => (
							<div key={field.name} className='mt-2'>
								<InputField<LLMConfigurationFormValues>
									name={field.name as keyof LLMConfigurationFormValues}
									rules={{ required: embeddingModel?.value ? `${field.label} is required` : false }}
									label={field.label}
									type='text'
									control={control}
									placeholder={field.placeholder}
									disabled={!LLMModel || !LLMModel.value}
								/>
							</div>
						))}
				</div>
			</div>

			{isTablet && (
				<div className='flex gap-8 mt-4'>
					<div className='flex-1'>
						{LLMModelRequiredFields.length > 0 &&
							LLMModelRequiredFields.map(field => (
								<div key={field.name}>
									<InputField<LLMConfigurationFormValues>
										name={field.name as keyof LLMConfigurationFormValues}
										rules={{ required: LLMModel?.value ? `${field.label} is required` : false }}
										label={field.label}
										type='text'
										control={control}
										placeholder={field.placeholder}
										disabled={!LLMModel || !LLMModel.value}
									/>
								</div>
							))}
					</div>
					<div className='flex-1'>
						{EmbeddingModelRequiredFields.length > 0 &&
							EmbeddingModelRequiredFields.map(field => (
								<div key={field.name}>
									<InputField<LLMConfigurationFormValues>
										name={field.name as keyof LLMConfigurationFormValues}
										rules={{
											required: embeddingModel?.value ? `${field.label} is required` : false
										}}
										label={field.label}
										type='text'
										control={control}
										placeholder={field.placeholder}
										// value={embeddingAPIKeyValue}
										disabled={!embeddingModel || !embeddingModel.value}
									/>
								</div>
							))}
					</div>
				</div>
			)}

			<hr className='mt-14 mb-5' />
			<div className='flex'>
				<button
					className='w-[137px] h-[41px] border border-gray-200 rounded-lg text-sm'
					type='button'
					onClick={updateOnboardedStatus}
				>
					I&apos;ll do this later
				</button>
				<button
					className='ml-auto w-[140px] h-[41px] disabled:bg-primary-200 bg-primary-500 text-white rounded-lg flex justify-center items-center text-sm'
					type='submit'
					disabled={!LLMModel?.value && !embeddingModel?.value}
				>
					{submitting ? (
						<ButtonSpinner className='mt-1 me-2' />
					) : (
						<>
							<span className='text-sm'>Get Started</span>
							<ChevronRightIcon className='ml-2 h-5 w-5' />
						</>
					)}
				</button>
			</div>
		</form>
	);
};

export default LLMConfigurationForm;
