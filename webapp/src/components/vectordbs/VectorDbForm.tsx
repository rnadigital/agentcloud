'use strict';

import * as API from '@api';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { VectorDb, VectorDbDocument } from 'struct/vectordb';

export default function VectorDbForm({
	vectorDb,
	editing,
	fetchVectorDbFormData,
	callback
}: {
	vectorDb?: VectorDbDocument;
	editing?: boolean;
	fetchVectorDbFormData?: Function;
	callback?: Function;
}) {
	const {
		register,
		handleSubmit,
		formState: { errors },
		setFocus,
		watch,
		setValue
	} = useForm<Partial<VectorDb>>({
		defaultValues: vectorDb || { name: '', type: '', apiKey: '', url: '' }
	});
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;

	const type = watch('type');

	const connectWithAPIKey = async () => {
		const { ConnectPopup } = await import('@pinecone-database/connect');
		ConnectPopup({
			onConnect: key => {
				setValue('apiKey', key.key);
			},
			integrationId: process.env.NODE_ENV === 'development' ? 'agentcloud-dev' : 'agentcloud'
		}).open();
	};

	const onSubmit = async (data: Partial<VectorDb>) => {
		if (editing) {
			await API.updateVectorDb(
				{
					_csrf: csrf,
					resourceSlug,
					vectorDbId: vectorDb._id,
					name: data.name,
					type: data.type,
					apiKey: data.apiKey,
					url: data.url
				},
				() => {
					toast.success('Variable Updated');

					if (!callback) {
						fetchVectorDbFormData?.();
						router.push(`/${resourceSlug}/vectordbs`);
					}
				},
				res => {
					toast.error(res);
				},
				null
			);
		} else {
			await API.addVectorDb(
				{ _csrf: csrf, resourceSlug, ...data },
				res => {
					callback?.({ label: data.name, value: res._id });
					toast.success('VectorDb Added');
					if (!callback) {
						fetchVectorDbFormData?.();
						router.push(`/${resourceSlug}/vectordbs`);
					}
				},
				res => {
					toast.error(res);
				},
				null
			);
		}
	};

	useEffect(() => {
		setFocus('name');
	}, []);

	return (
		<>
			<form onSubmit={handleSubmit(onSubmit)}>
				<input type='hidden' name='_csrf' value={csrf} />
				<div className='space-y-6'>
					<div>
						<label
							htmlFor='name'
							className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
						>
							Name<span className='text-red-700'> *</span>
						</label>
						<input
							id='name'
							type='text'
							{...register('name', {
								required: 'Name is required',
								pattern: {
									value: /^\S*$/,
									message: 'No spaces allowed'
								}
							})}
							className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white ${errors.name ? 'border-red-500' : ''}`}
						/>
						{errors.name && <span className='text-red-500'>{errors.name.message as string}</span>}
					</div>

					<div className='sm:col-span-12'>
						<label
							htmlFor='type'
							className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
						>
							Vector DB Type<span className='text-red-700'> *</span>
						</label>
						<div className='mt-2'>
							<select
								{...register('type', { required: 'Type is required' })}
								id='type'
								name='type'
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-gray-50'
							>
								<option disabled value=''>
									Select a type...
								</option>
								{['pinecone', 'qdrant'].map(option => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
						</div>
					</div>

					{type === 'pinecone' && (
						<button
							className='bg-white w-full flex p-4 items-center'
							onClick={() => connectWithAPIKey()}
							type='button'
						>
							<span className='text-sm font-medium'>Connect Securely with Pinecone</span>
							<div className='px-5 py-2 bg-primary-600 text-white rounded-md ml-auto font-semibold text-sm'>
								Connect{' '}
							</div>
						</button>
					)}

					<div>
						<label
							htmlFor='defaultValue'
							className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
						>
							API Key<span className='text-red-700'> *</span>
						</label>
						<input
							id='defaultValue'
							type='text'
							{...register('apiKey', { required: true })}
							className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white ${errors.apiKey ? 'border-red-500' : ''}`}
						/>
						{errors.apiKey && <span className='text-red-500'>This field is required</span>}
					</div>

					{type === 'qdrant' && (
						<div>
							<label
								htmlFor='defaultValue'
								className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
							>
								URL
							</label>
							<input
								id='defaultValue'
								type='text'
								{...register('url', {
									pattern: {
										value: /:6334$/,
										message: 'Ensure that the url has :6334 at the end'
									},
									required: 'This field is required'
								})}
								placeholder='https://076fdfeb-c8f5-437e-aa59-7cd6ee41b844.us-east4-0.gcp.cloud.qdrant.io:6334'
								className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white ${errors.url ? 'border-red-500' : ''}`}
							/>
							{errors.url && <span className='text-red-500'>{errors.url.message}</span>}
						</div>
					)}

					<div className='mt-6 flex items-center justify-between gap-x-6'>
						<button
							type='submit'
							className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
						>
							{editing ? 'Update Vector DB' : 'Add Vector DB'}
						</button>
					</div>
				</div>
			</form>
		</>
	);
}

// const PineConeFields = ({}: {}) => {
// 	const connectWithAPIKey = async () => {
// 		const { ConnectPopup } = await import('@pinecone-database/connect'); // Dynamic import
// 		/* Call ConnectPopup function with an object containing options */
// 		ConnectPopup({
// 			onConnect: key => {
// 				setValue('apiKey', key.key);
// 			},
// 			integrationId: 'ian'
// 		}).open();
// 	};

// 	return (
// 		<div className='w-full bg-primary-50 flex flex-col text-gray-500'>
// 			<div className='ml-auto'>
// 				<XCircleIcon
// 					className='h-6 w-6 text-gray-500 mr-2 mt-2 cursor-pointer'
// 					onClick={() => setSelectedDB(null)}
// 				/>
// 			</div>
// 			<div className='px-8 mt-4 pb-12'>
// 				<button
// 					className='bg-white w-full flex p-4 items-center'
// 					onClick={() => connectWithAPIKey()}
// 				>
// 					<span className='text-sm font-medium'>Connect Securely with Pinecone</span>
// 					<div className='px-5 py-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white rounded-md ml-auto'>
// 						Connect{' '}
// 					</div>
// 				</button>
// 				<div className='my-4 flex justify-center text-sm'>or</div>
// 				<div>
// 					<div className='mb-2 text-sm'>Connect with API key</div>
// 					<InputField<FormValues>
// 						name='apiKey'
// 						control={control}
// 						rules={{
// 							required: 'API key is required'
// 						}}
// 						type='text'
// 						placeholder='Enter your API key'
// 					/>
// 				</div>
// 			</div>
// 		</div>
// 	);
// };
