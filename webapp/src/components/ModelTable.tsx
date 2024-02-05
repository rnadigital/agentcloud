'use strict';

import { TrashIcon } from '@heroicons/react/20/solid';
import DeleteModal from 'components/DeleteModal';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import * as API from '../api';
import { useAccountContext } from '../context/account';

export default function ModelTable({ models, credentials, fetchModels }: { models: any[], credentials: any[], fetchModels?: any }) {

	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [deletingModel, setDeletingModel] = useState(null);
	const [open, setOpen] = useState(false);

	async function deleteModel() {
		await API.deleteModel({
			_csrf: csrf,
			modelId: deletingModel._id,
			resourceSlug,
		}, () => {
			fetchModels();
			toast('Deleted model');
		}, () => {
			toast.error('Error deleting model');
		}, router);
		setOpen(false);
	}

	useEffect(() => {
		let timeout;
		if (!open) {
			timeout = setTimeout(() => {
				setDeletingModel(null);
			}, 500);
		}
		return () => clearTimeout(timeout);
	}, [open]);

	return (
		<>
			<DeleteModal
				open={open}
				confirmFunction={deleteModel}
				cancelFunction={() => {
					setOpen(false);
				}}
				title={'Delete Model'}
				message={`Are you sure you want to delete the model "${deletingModel?.name}". This action cannot be undone.`}
			/>
			<div className='rounded-lg overflow-hidden shadow'>
				<table className='min-w-full divide-y divide-gray-200'>
					<thead className='bg-gray-50'>
						<tr>
							<th scope='col' className='w-min px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
								Name
							</th>
							<th scope='col' className='w-min px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
								Model
							</th>
							{/* Add more columns as necessary */}
							<th scope='col' className='w-min px-6 py-3 w-20 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
								Embedding Length
							</th>
							<th scope='col' className='w-min px-6 py-3 w-20 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
								Credential Name
							</th>
							<th scope='col' className='w-min px-6 py-3 w-20 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
								Actions
							</th>
						</tr>
					</thead>
					<tbody className='bg-white divide-y divide-gray-200'>
						{models.map((model) => (
							<tr key={model._id}>
								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='text-sm text-gray-900'>{model.name}</div>
								</td>
								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='text-sm text-gray-900'>{model.model}</div>
								</td>
								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='text-sm text-gray-900'>{model.embeddingLength ? model.embeddingLength : '-'}</div>
								</td>
								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='text-sm text-gray-900'>{credentials.find(c => c._id === model.credentialId)?.name || '-'}</div>
								</td>
								{/* Add more columns as necessary */}
								<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
									<button
										onClick={() => {
											setDeletingModel(model);
											setOpen(true);
										}}
										className='text-red-500 hover:text-red-700'
									>
										<TrashIcon className='h-5 w-5' aria-hidden='true' />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</>
	);
}
