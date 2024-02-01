'use strict';

import { TrashIcon } from '@heroicons/react/20/solid';
import DeleteModal from 'components/DeleteModal';
import { useRouter } from 'next/router';
import { useEffect,useState } from 'react';
import { toast } from 'react-toastify';

import * as API from '../api';
import { useAccountContext } from '../context/account';

export default function CredentialTable({ credentials, fetchCredentials }: { credentials: any[], fetchCredentials?: any }) {

	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [deletingCredential, setDeletingCredential] = useState(null);
	const [open, setOpen] = useState(false);

	async function deleteCredential() {
		await API.deleteCredential({
			_csrf: csrf,
			credentialId: deletingCredential._id,
			resourceSlug,
		}, () => {
			fetchCredentials();
			toast('Deleted credential');
		}, () => {
			toast.error('Error deleting credential');
		}, router);
		setOpen(false);
	}

	useEffect(() => {
		if (!open) {
			setTimeout(() => {
				setDeletingCredential(null);
			}, 500);
		}
	}, [open]);

	return (
		<>
			<DeleteModal
				open={open}
				confirmFunction={deleteCredential}
				cancelFunction={() => {
					setOpen(false);
				}}
				title={'Delete Credential'}
				message={deletingCredential && `Are you sure you want to delete the ${deletingCredential?.type} credential "${deletingCredential?.name}". This action cannot be undone.`}
			/>
			<div className='rounded-lg overflow-hidden shadow'>
				<table className='min-w-full divide-y divide-gray-200'>
					<thead className='bg-gray-50'>
						<tr>
							<th scope='col' className='w-min px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
								Name
							</th>
							<th scope='col' className='w-min px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
								Type
							</th>
							{/* Add more columns as necessary */}
							<th scope='col' className='w-min px-6 py-3 w-20 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
								Endpoint
							</th>
							<th scope='col' className='w-min px-6 py-3 w-20 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
								Actions
							</th>
						</tr>
					</thead>
					<tbody className='bg-white divide-y divide-gray-200'>
						{credentials.map((credential) => (
							<tr key={credential._id}>
								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='text-sm text-gray-900'>{credential.name}</div>
								</td>
								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='text-sm text-gray-900'>{credential.type}</div>
								</td>
								<td className='px-6 py-4 whitespace-nowrap'>
									<div className='text-sm text-gray-900'>{credential?.credentials?.endpointURL || '-'}</div>
								</td>
								{/* Add more columns as necessary */}
								<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
									<button
										onClick={() => {
											setDeletingCredential(credential);
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
