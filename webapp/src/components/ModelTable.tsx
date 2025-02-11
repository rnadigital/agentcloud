'use strict';

import * as API from '@api';
import { TrashIcon } from '@heroicons/react/20/solid';
import DeleteModal from 'components/DeleteModal';
import DevBadge from 'components/DevBadge';
import ErrorAlert from 'components/ErrorAlert';
import { useAccountContext } from 'context/account';
import cn from 'utils/cn';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ModelContextWindow, ModelKnowledgeCutoff } from 'struct/model';

export default function ModelTable({ models, fetchModels }: { models: any[]; fetchModels?: any }) {
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [deletingModel, setDeletingModel] = useState(null);
	const [deletingMap, setDeletingMap] = useState({});
	const [error, setError] = useState(null);
	const [open, setOpen] = useState(false);

	async function deleteModel() {
		setDeletingMap(oldMap => {
			oldMap[deletingModel._id] = true;
			return oldMap;
		});
		const start = Date.now();
		try {
			await API.deleteModel(
				{
					_csrf: csrf,
					modelId: deletingModel._id,
					resourceSlug
				},
				async () => {
					await new Promise(res => setTimeout(res, 700 - (Date.now() - start)));
					fetchModels();
					setDeletingMap(oldMap => {
						delete oldMap[deletingModel._id];
						return oldMap;
					});
				},
				err => {
					setError(`Error deleting model: ${err}`);
					setDeletingMap(oldMap => {
						delete oldMap[deletingModel._id];
						return oldMap;
					});
				},
				router
			);
		} catch (e) {
			console.error(e);
			setError(e);
		} finally {
			setOpen(false);
		}
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
								Model
							</th>

							<th
								scope='col'
								className='w-min px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-50'
							>
								Embedding Length
							</th>
							<th
								scope='col'
								className='w-min px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-50'
							>
								Knowledge Cutoff
							</th>
							<th
								scope='col'
								className='w-min px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-50'
							>
								Context Window
							</th>

							{/* Add more columns as necessary */}

							<th
								scope='col'
								className='w-min px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-50'
							>
								Actions
							</th>
						</tr>
					</thead>
					<tbody className='bg-white divide-y divide-gray-200 dark:bg-gray-700'>
						{models.map(model => {
							const knowledgeCutoffDate =
								ModelKnowledgeCutoff[model.model] && new Date(ModelKnowledgeCutoff[model.model]);
							return (
								<tr
									key={model._id}
									className={cn(
										'transition-all opacity-1 duration-700',
										deletingMap[model._id]
											? 'bg-red-400'
											: 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-500 dark:text-gray-50'
									)}
									style={{ borderColor: deletingMap[model._id] ? 'red' : '' }}
								>
									<td
										className={'px-6 py-4 whitespace-nowrap'}
										onClick={() => router.push(`/${resourceSlug}/model/${model._id}/edit`)}
									>
										<div className='text-sm text-gray-900 dark:text-white'>{model.name}</div>
										<DevBadge value={model?._id} />
									</td>
									<td
										className='px-6 py-4 whitespace-nowrap'
										onClick={() => router.push(`/${resourceSlug}/model/${model._id}/edit`)}
									>
										<div className='text-sm text-gray-900 dark:text-white'>{model.model}</div>
									</td>
									<td
										className='px-6 py-4 whitespace-nowrap'
										onClick={() => router.push(`/${resourceSlug}/model/${model._id}/edit`)}
									>
										<div className='text-sm text-gray-900 dark:text-white'>
											{model.embeddingLength ? model.embeddingLength : '-'}
										</div>
									</td>

									<td
										className='px-6 py-4 whitespace-nowrap'
										onClick={() => router.push(`/${resourceSlug}/model/${model._id}/edit`)}
									>
										<div
											suppressHydrationWarning={true}
											className='text-sm text-gray-900 dark:text-white'
										>
											{knowledgeCutoffDate
												? `${knowledgeCutoffDate.toLocaleString('en-US', { month: 'short' })} ${knowledgeCutoffDate.getFullYear()}`
												: '-'}
										</div>
									</td>

									<td
										className='px-6 py-4 whitespace-nowrap'
										onClick={() => router.push(`/${resourceSlug}/model/${model._id}/edit`)}
									>
										<div className='text-sm text-gray-900 dark:text-white'>
											{ModelContextWindow[model.model]?.toLocaleString() || '-'}
										</div>
									</td>
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
							);
						})}
					</tbody>
				</table>
			</div>
		</>
	);
}
