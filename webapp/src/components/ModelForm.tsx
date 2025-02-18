'use strict';

import * as API from '@api';
import ModelTypeRequirementsComponent from 'components/models/ModelTypeRequirements';
import SubscriptionModal from 'components/SubscriptionModal';
import { useAccountContext } from 'context/account';
import cn from 'utils/cn';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useReducer } from 'react';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { pricingMatrix } from 'struct/billing';
import { ModelList, modelOptions, ModelType } from 'struct/model';

export default function ModelForm({
	_model = { type: ModelType.OPENAI },
	editing,
	compact,
	fetchModelFormData,
	callback,
	modelFilter,
	modelTypeFilters
}: {
	_model?: any;
	editing?: boolean;
	compact?: boolean;
	fetchModelFormData?: Function;
	callback?: Function;
	modelFilter?: string;
	modelTypeFilters?: ModelType[];
}) {
	//TODO: fix any type

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const { stripePlan } = account?.stripe || {};
	const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [modelState, setModelState] = useState(_model);
	const [modelName, setModelName] = useState(modelState?.name || '');
	const [config, setConfig] = useReducer(configReducer, modelState?.config || {});
	const filteredModelOptions = modelOptions.filter(
		option =>
			!modelTypeFilters || modelTypeFilters.length === 0 || modelTypeFilters.includes(option.value)
	);
	function configReducer(state, action) {
		return {
			...state,
			[action.name]: action.value
		};
	}

	const { _id, name, type } = modelState;
	const { model } = config;
	async function modelPost(e) {
		e.preventDefault();
		if (!stripePlan || !pricingMatrix[stripePlan].llmModels.includes(type)) {
			return setSubscriptionModalOpen(true);
		}
		const body = {
			_csrf: e.target._csrf.value,
			resourceSlug,
			name: e.target.modelName.value,
			model: model,
			modelId: modelState._id,
			config: config,
			type: modelState?.type
		};
		if (editing) {
			await API.editModel(
				body,
				() => {
					toast.success('Model Updated');
				},
				res => {
					toast.error(res);
				},
				null
			);
		} else {
			const addedModel: any = await API.addModel(
				body,
				() => {
					toast.success('Added Model');
				},
				res => {
					toast.error(res);
				},
				compact ? null : router
			);
			callback && addedModel && callback(addedModel._id);
		}
	}

	return (
		<>
			<SubscriptionModal
				open={subscriptionModalOpen !== false}
				setOpen={setSubscriptionModalOpen}
				title='Upgrade Required'
				text={`Your current plan does not support adding the model "${model}"`}
				buttonText='Upgrade'
			/>
			<form onSubmit={modelPost}>
				<input type='hidden' name='_csrf' value={csrf} />
				<div className='space-y-12'>
					<div className='space-y-6'>
						{!compact && !editing && (
							<p className='mt-1 text-sm leading-6 text-gray-600 dark:text-gray-50'>
								Configure models to be used for agents and/or embedding data sources.
							</p>
						)}
						<div>
							<label
								htmlFor='modelName'
								className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
							>
								Name
							</label>
							<div className='mt-2'>
								<input
									type='text'
									name='modelName'
									id='modelName'
									className='bg-white dark:bg-slate-800 rounded-md border border-gray-300 dark:border-gray-600 w-full h-9 p-1 pl-3 text-gray-500 dark:text-gray-50 disabled:bg-gray-200 text-sm focus:ring-indigo-600'
									onChange={e => setModelName(e.target.value)}
									required
									value={modelName}
								/>
							</div>
						</div>
						<div className='sm:col-span-12'>
							<label
								htmlFor='type'
								className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
							>
								Vendor
							</label>
							<div className='mt-2'>
								<select
									required
									id='type'
									name='type'
									className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-gray-50'
									value={type}
									onChange={(e: any) => {
										const newType: ModelType = e.target.value as ModelType;
										const defaultModel = ModelList[newType][0];
										setConfig({
											name: 'model',
											value: !modelFilter && !modelTypeFilters ? defaultModel : ''
										});
										setModelState(oldModel => ({
											...oldModel,
											type: newType
										}));
									}}
								>
									<option disabled value=''>
										Select a type...
									</option>
									{filteredModelOptions.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>
						</div>
						<ModelTypeRequirementsComponent
							type={type}
							config={config}
							setConfig={setConfig}
							modelFilter={modelFilter}
						/>
					</div>
				</div>
				<div className='mt-6 flex items-center justify-between gap-x-6'>
					{!compact && (
						<Link
							className='text-sm font-semibold leading-6 text-gray-900'
							href={`/${resourceSlug}/models`}
						>
							Back
						</Link>
					)}
					<button
						type='submit'
						className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
					>
						Save
					</button>
				</div>
			</form>
		</>
	);
}
