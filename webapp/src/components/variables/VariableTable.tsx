'use strict';

import * as API from '@api';
import { TrashIcon } from '@heroicons/react/20/solid';
import DeleteModal from 'components/DeleteModal';
import ErrorAlert from 'components/ErrorAlert';
import { useAccountContext } from 'context/account';
import cn from 'utils/cn';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function VariableTable({
	variables,
	fetchVariables
}: {
	variables: any[];
	fetchVariables?: any;
}) {
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [deletingVariable, setDeletingVariable] = useState(null);
	const [deletingMap, setDeletingMap] = useState({});
	const [error, setError] = useState(null);
	const [open, setOpen] = useState(false);

	async function deleteVariable() {
		setDeletingMap(oldMap => {
			oldMap[deletingVariable._id] = true;
			return oldMap;
		});
		try {
			await API.deleteVariable(
				{
					_csrf: csrf,
					variableId: deletingVariable._id,
					resourceSlug
				},
				() => {},
				err => {
					toast.error(err);
				},
				router
			);
		} catch (e) {
			console.error(e);
			setError(e);
		} finally {
			setDeletingMap(oldMap => {
				delete oldMap[deletingVariable._id];
				return oldMap;
			});
			fetchVariables();
			setOpen(false);
		}
	}

	useEffect(() => {
		let timeout;
		if (!open) {
			timeout = setTimeout(() => {
				setDeletingVariable(null);
			}, 500);
		}
		return () => clearTimeout(timeout);
	}, [open]);

	return (
		<>
			<DeleteModal
				open={open}
				confirmFunction={deleteVariable}
				cancelFunction={() => {
					setOpen(false);
				}}
				title={'Delete Variable'}
				message={`Are you sure you want to delete the variable "${deletingVariable?.name}". This action cannot be undone.`}
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
								className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-50'
							>
								Name
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-50'
							>
								Default Value
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-50'
							>
								Created By
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-50'
							>
								Created On
							</th>

							<th
								scope='col'
								className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-50'
							>
								Actions
							</th>
						</tr>
					</thead>
					<tbody className='bg-white divide-y divide-gray-200 dark:bg-gray-700'>
						{variables.map(variable => (
							<tr
								key={variable._id}
								onClick={() => router.push(`/${resourceSlug}/variable/${variable._id}/edit`)}
								className={cn(
									'transition-all opacity-1 duration-700',
									deletingMap[variable._id]
										? 'bg-red-400'
										: 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-500 dark:text-gray-50'
								)}
							>
								<td
									className='px-6 py-4 whitespace-nowrap'
									onClick={() => router.push(`/${resourceSlug}/variable/${variable._id}/edit`)}
								>
									<div className='text-sm text-gray-900 dark:text-white'>{variable.name}</div>
								</td>
								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='text-sm text-gray-900 dark:text-white'>
										{variable.defaultValue}
									</div>
								</td>
								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='text-sm text-gray-900 dark:text-white'>{variable.createdBy}</div>
								</td>

								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='text-sm text-gray-900 dark:text-white'>
										{new Date(variable.createDate).toDateString()}
									</div>
								</td>
								<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
									<button
										onClick={e => {
											e.stopPropagation();
											setDeletingVariable(variable);
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
