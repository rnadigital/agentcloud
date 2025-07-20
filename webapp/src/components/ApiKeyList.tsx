'use strict';

import * as API from '@api';
import { ArrowPathIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';
import DeleteModal from 'components/DeleteModal';
import ErrorAlert from 'components/ErrorAlert';
import { useAccountContext } from 'context/account';
import cn from 'utils/cn';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { CopyToClipboardButton } from './chat/message';
import ConfirmModal from './ConfirmModal';

export default function ApiKeyList({ keys, fetchKeys }: { keys: any[]; fetchKeys?: any }) {
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [deletingModel, setDeletingModel] = useState(null);
	const [regeneratingKey, setRegeneratingKey] = useState(null);
	const [deletingMap, setDeletingMap] = useState({});
	const [error, setError] = useState(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [regenerateOpen, setRegenerateOpen] = useState(false);

	const handleCopyClick = async dataToCopy => {
		try {
			await navigator.clipboard.writeText(dataToCopy);
			toast.success('Copied to clipboard');
		} catch {
			/* ignored for now */
		}
	};
	async function deleteKey(keyId, ownerId) {
		setDeleteOpen(false);
		API.deleteKey(
			{
				_csrf: csrf,
				ownerId,
				keyId
			},
			() => {
				fetchKeys();
				toast('Deleted Key');
			},
			() => {
				toast.error('Error deleting Key');
			},
			router
		);
	}

	async function regenerateKey(keyId, ownerId) {
		//TODO: implement regeneration of key
		API.incrementKeyVersion(
			{
				_csrf: csrf,
				ownerId,
				keyId
			},
			() => {
				fetchKeys();
				toast('Regenerated Key');
				setRegenerateOpen(false);
			},
			() => {
				toast.error('Error Regenerating Key');
				setRegenerateOpen(false);
			},
			router
		);
	}

	useEffect(() => {
		let timeout;
		if (!deleteOpen) {
			timeout = setTimeout(() => {
				setDeletingModel(null);
			}, 500);
		}
		return () => clearTimeout(timeout);
	}, [deleteOpen]);

	return (
		<>
			<DeleteModal
				open={deleteOpen}
				confirmFunction={() => {
					deleteKey(deletingModel?._id, deletingModel?.ownerId);
					fetchKeys();
				}}
				cancelFunction={() => {
					setDeleteOpen(false);
				}}
				title={'Delete Key'}
				message={`Are you sure you want to delete the key "${deletingModel?.name}". This action cannot be undone and this key will cease to function.`}
			/>
			<ConfirmModal
				open={regenerateOpen}
				setOpen={setRegenerateOpen}
				confirmFunction={() => {
					regenerateKey(regeneratingKey?._id, regeneratingKey?.ownerId);
					fetchKeys();
				}}
				cancelFunction={() => {
					setRegenerateOpen(false);
				}}
				title={'Regenerate Key'}
				message={`Are you sure you want to regenerate the key "${regeneratingKey?.name}". This action cannot be undone and old versions of this key will cease to function.`}
			/>
			{error && (
				<div className='my-4'>
					<ErrorAlert error={error} />
				</div>
			)}
			<div className='rounded-lg overflow-hidden shadow overflow-x-auto'>
				<table className='min-w-full divide-y divide-gray-200'>
					<thead className='bg-gray-50 dark:bg-gray-700'>
						<tr>
							<th
								scope='col'
								className='w-min px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-50'
							>
								Name
							</th>
							<th
								scope='col'
								className='w-min px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-50'
							>
								Description
							</th>

							<th
								scope='col'
								className='w-min px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-50'
							>
								Token
							</th>
							<th
								scope='col'
								className='w-min px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-50'
							>
								Expiry
							</th>

							{/* Add more columns as necessary */}

							<th
								scope='col'
								className='w-min px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-50'
							>
								Actions
							</th>
						</tr>
					</thead>
					<tbody className='bg-white divide-y divide-gray-200 dark:bg-gray-700'>
						{keys.map(key => {
							let keyDate: string;
							if (key?.expirationDate === null) {
								keyDate = 'Never';
							} else {
								keyDate = new Date(key?.expirationDate).toDateString();
							}
							return (
								<tr
									key={key._id}
									className={cn(
										'transition-all opacity-1 duration-700',
										deletingMap[key._id]
											? 'bg-red-400'
											: 'hover:bg-gray-50 dark:hover:bg-gray-500 dark:text-gray-50'
									)}
									style={{ borderColor: deletingMap[key._id] ? 'red' : '' }}
								>
									<td className={'px-6 py-4 whitespace-nowrap'} onClick={() => router.push(``)}>
										<div className='text-sm text-gray-900 dark:text-white'>{key.name}</div>
									</td>
									<td className='px-6 py-4 text-wrap' onClick={() => router.push(``)}>
										<div className='text-sm text-gray-900 dark:text-white'>
											{key?.description || '-'}
										</div>
									</td>
									<td
										className='px-6 py-4 whitespace-nowrap'
										onClick={() => handleCopyClick(key?.token)}
									>
										<div className='text-sm max-w-36 text-gray-900 dark:text-white truncate hover:text-blue-600 hover:underline cursor-pointer'>
											{key?.token}
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap' onClick={() => router.push(``)}>
										<div className='text-sm max-w-36 text-gray-900 dark:text-white truncate'>
											{keyDate}
										</div>
									</td>

									<td className='flex flex-row justify-center items-center w-full gap-5 px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
										<button
											onClick={() => {
												setRegeneratingKey(key);
												setRegenerateOpen(true);
											}}
											className='text-gray-900 hover:text-gray-400'
										>
											<ArrowPathIcon className='h-5 w-5' aria-hidden='true' />
										</button>

										<CopyToClipboardButton dataToCopy={key?.token} />

										<>
											<button
												onClick={() => {
													setDeletingModel(key);
													setDeleteOpen(true);
												}}
												className='text-red-500 hover:text-red-700'
												data-tooltip-target='delete-tooltip'
											>
												<TrashIcon className='h-5 w-5' aria-hidden='true' />
											</button>
										</>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</>
	);
}
