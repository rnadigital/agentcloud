import * as API from '@api';
import { Dialog, Transition } from '@headlessui/react';
import { TrashIcon } from '@heroicons/react/20/solid';
import ButtonSpinner from 'components/ButtonSpinner';
import DatasourceChunkingForm from 'components/DatasourceChunkingForm';
import SubscriptionModal from 'components/SubscriptionModal';
import { useAccountContext } from 'context/account';
import getFileFormat from 'misc/getfileformat';
import { useRouter } from 'next/router';
import path from 'path';
import React, { Fragment, useCallback, useReducer, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { pricingMatrix, SubscriptionPlan } from 'struct/billing';
import { Retriever } from 'struct/tool';
import formatSize from 'utils/formatsize';
import submittingReducer from 'utils/submittingreducer';

import { defaultChunkingOptions } from '../lib/misc/defaultchunkingoptions';

export default function DropZone({
	modalOpen,
	children,
	setFiles,
	files,
	modelId,
	name,
	callback,
	description,
	retriever,
	compact
}: {
	modalOpen: boolean;
	children: any;
	setFiles: any;
	files: any[];
	modelId: string;
	name: string;
	description: string;
	retriever?: Retriever;
	callback?: Function;
	compact?: boolean;
}) {
	const [accountContext]: any = useAccountContext();
	const { csrf, account } = accountContext as any;
	const { stripePlan } = account?.stripe || {};
	const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
	const router = useRouter();
	const { resourceSlug } = router.query;
	const maxSize = pricingMatrix[stripePlan]?.maxFileUploadBytes;
	const [loading, setLoading] = useState(false);
	const [chunkingConfig, setChunkingConfig] = useReducer(submittingReducer, {
		...defaultChunkingOptions
	});
	const cancelButtonRef = useRef(null);

	const uploadFiles = async e => {
		e.preventDefault();
		try {
			setLoading(true);
			const formData = new FormData();
			formData.set('resourceSlug', resourceSlug as string);
			formData.set('modelId', modelId as string);
			formData.set('datasourceDescription', description as string);
			formData.set('name', name as string);
			formData.set('retriever', retriever as string);
			formData.set('_csrf', csrf as string);
			Object.entries(chunkingConfig).forEach(([key, value]) => {
				if (value != null) {
					formData.set(key, value as string);
				}
			});
			acceptedFiles.forEach(file => {
				formData.append('file', file);
			});
			await API.uploadDatasourceFileTemp(
				formData,
				res => {
					toast.success('Datasource created successfully');
					callback && callback(res);
				},
				res => {
					toast.error(res);
				},
				router
			);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const onDrop = useCallback(
		newAcceptedFiles => {
			setFiles(newAcceptedFiles);
		},
		[files]
	);

	const onDropRejected = useCallback(fileRejections => {
		console.log(fileRejections);
		if (fileRejections[0]?.errors?.[0]?.code === 'file-too-large') {
			if ([SubscriptionPlan.ENTERPRISE].includes(stripePlan)) {
				return toast.error(`Maximum file size exceeded (${formatSize(maxSize)}).`);
			} else {
				setSubscriptionModalOpen(true);
			}
		} else if (fileRejections[0]?.errors?.[0]?.code === 'file-invalid-type') {
			toast.error('File type not supported');
		} else {
			toast.error(fileRejections[0]?.errors?.[0]?.message || 'An error occurred');
		}
	}, []);

	// @ts-ignore
	let { isDragActive, getRootProps, getInputProps, isDragReject, acceptedFiles, rejectedFiles } =
		useDropzone({
			onDropRejected,
			onDrop,
			minSize: 0,
			maxSize,
			maxFiles: 1,
			accept: {
				'text/csv': ['.csv'],
				'message/rfc822': ['.eml', '.msg'],
				'application/pkcs7-signature': ['.p7s'],
				'application/epub+zip': ['.epub'],
				'application/vnd.ms-excel': ['.xls'],
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
				'text/html': ['.html', '.htm'],
				'image/bmp': ['.bmp'],
				'image/heic': ['.heic'],
				'image/jpeg': ['.jpeg', '.jpg'],
				'image/png': ['.png'],
				'image/tiff': ['.tiff'],
				'text/markdown': ['.md'],
				'text/org': ['.org'], // Unknown MIME type for .org
				'application/vnd.oasis.opendocument.text': ['.odt'],
				'application/pdf': ['.pdf'],
				'text/plain': ['.txt'],
				'application/vnd.ms-powerpoint': ['.ppt'],
				'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
				'text/x-rst': ['.rst'],
				'text/rtf': ['.rtf'],
				'text/tab-separated-values': ['.tsv'],
				'application/msword': ['.doc'],
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
				'application/xml': ['.xml']
			}
		});

	const isFileTooLarge =
		rejectedFiles && rejectedFiles.length > 0 && rejectedFiles[0].size > maxSize;
	const open = files != null && files.length > 0;

	const formContent = (
		<>
			<form onSubmit={uploadFiles} className='m-auto w-full'>
				{files &&
					files.map((acceptedFile, ai) => (
						<li
							key={`acceptedFile_${ai}`}
							className='text-white bg-green-600 border-green-700 border rounded p-3 my-3'
						>
							{acceptedFile.name} ({formatSize(parseInt(acceptedFile.size))})
							<button
								type='button'
								onClick={() => {
									setFiles(null);
								}}
								className='float-right rounded-md disabled:bg-slate-400 bg-red-600 ms-2 p-1 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 mt-0'
							>
								<TrashIcon className='h-4 w-4' />
							</button>
						</li>
					))}
				{children}
				<details>
					<summary className='text-sm cursor-pointer ms-1 my-4 mb-5 dark:text-gray-50'>
						Chunking options
					</summary>
					<DatasourceChunkingForm
						chunkingConfig={chunkingConfig}
						setChunkingConfig={setChunkingConfig}
					/>
				</details>
				<button
					disabled={
						loading || !files || !modelId
						//TODO: more checks
					}
					type='submit'
					className='w-full rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
				>
					{loading && <ButtonSpinner />}
					Upload
				</button>
			</form>
		</>
	);

	const fileUploader = (
		<label
			{...getRootProps({ className: 'dropzone' })}
			htmlFor='file'
			className='block text-center border-2 border-dashed p-4 rounded mb-4 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700'
		>
			<input id='file' {...getInputProps({ className: 'w-full h-full' })} />
			{!isDragActive && 'Click here or drop a file to upload'}
			{isDragActive && "Drop it like it's hot!"}
			<div
				className={`absolute bg-indigo-900/10 z-50 fixed w-screen h-screen top-0 left-0 border-dotted border-2 border-indigo-600 rounded-lg overflow-hidden transition-all duration-300 pointer-events-none ${isDragActive ? 'opacity-1' : 'opacity-0'}`}
			/>
			{isDragReject && 'File type not accepted, sorry!'}
			{isFileTooLarge && <div className='text-danger mt-2'>File is too large.</div>}
		</label>
	);

	if (compact) {
		return (
			<div>
				{fileUploader}
				{formContent}
			</div>
		);
	}

	return (
		<span className='m-auto w-full'>
			<SubscriptionModal
				open={subscriptionModalOpen !== false}
				setOpen={setSubscriptionModalOpen}
				title='File Size Exceeded'
				text={`Your current plan '${stripePlan}' allows files up to ${formatSize(maxSize)}. Please upgrade your plan if you need to upload larger files. `}
				buttonText='Upgrade'
			/>
			<ul>
				{fileUploader}

				<Transition.Root show={open === true} as={Fragment}>
					<Dialog
						as='div'
						className='relative z-10'
						initialFocus={cancelButtonRef}
						onClose={() => {
							if (!modalOpen) {
								setFiles(null);
							}
						}}
					>
						<Transition.Child
							as={Fragment}
							enter='ease-out duration-300'
							enterFrom='opacity-0'
							enterTo='opacity-100'
							leave='ease-in duration-200'
							leaveFrom='opacity-100'
							leaveTo='opacity-0'
						>
							<div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
						</Transition.Child>

						<div className='fixed inset-0 z-10 w-screen overflow-y-auto'>
							<div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
								<Transition.Child
									as={Fragment}
									enter='ease-out duration-300'
									enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
									enterTo='opacity-100 translate-y-0 sm:scale-100'
									leave='ease-in duration-200'
									leaveFrom='opacity-100 translate-y-0 sm:scale-100'
									leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
								>
									<Dialog.Panel className='relative transform overflow-hidden rounded-lg bg-white px-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 dark:bg-slate-800'>
										<div>
											<div className='text-center'>
												<Dialog.Title
													as='h3'
													className='font-semibold text-gray-900 dark:text-white'
												>
													Upload File
												</Dialog.Title>
											</div>
										</div>
										{formContent}
									</Dialog.Panel>
								</Transition.Child>
							</div>
						</div>
					</Dialog>
				</Transition.Root>
			</ul>
		</span>
	);
}
