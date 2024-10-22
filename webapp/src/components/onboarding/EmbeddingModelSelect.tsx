import { InformationCircleIcon } from '@heroicons/react/24/outline';
import ToolTip from 'components/shared/ToolTip';
import { useOnboardinFormContext } from 'context/onboardingform';
import React, { useEffect, useState } from 'react';
import { ModelEmbeddingLength, ModelList, modelOptions } from 'struct/model';

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
	embeddingType: LLMOption;
	embeddingModel: LLMOption;
	llmModelConfig: Record<string, string>;
	embeddedModelConfig: Record<string, string>;
}

const EmbeddingModelSelect = () => {
	const { control, watch, setValue, resetField } =
		useOnboardinFormContext<LLMConfigurationFormValues>();
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

	const [userSelectedEmbeddingType, setUserSelectedEmbeddingType] = useState(false);

	const handleSetUserSelectedEmbeddingType = () => {
		setUserSelectedEmbeddingType(true);
	};

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

	return (
		<div className='flex-1'>
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
		</div>
	);
};

export default EmbeddingModelSelect;
