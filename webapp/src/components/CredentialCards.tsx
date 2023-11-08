import { Fragment, useState } from 'react';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import {
	TrashIcon,
	KeyIcon,
} from '@heroicons/react/20/solid';
import * as API from '../api';
import { useRouter } from 'next/router';
import { useAccountContext } from '../context/account';
import DeleteModal from './DeleteModal';
import { toast } from 'react-toastify';
function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

//TODO: move to lib
const platformIcons = {
	'OPENAI': <img height='24' width='24' className='invert' src='https://openai.com/favicon.ico' />
}

export default function CredentialCards({ credentials, fetchCredentials }: { credentials: any[], fetchCredentials?: any }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const resourceSlug = account.currentTeam;
	const [deletingCredential, setDeletingCredential] = useState(null);
	const [open, setOpen] = useState(false);
	const router = useRouter();

	async function deleteCredential() {
		await API.deleteCredential({
			_csrf: csrf,
			credentialId: deletingCredential._id,
		}, () => {
			fetchCredentials();
			toast('Deleted credential');
		}, () => {
			toast.error('Error deleting credential');
		}, router);
		setDeletingCredential(null);
		setOpen(false);
	}

	return (<>
		<DeleteModal
			open={open}
			confirmFunction={deleteCredential}
			cancelFunction={() => {
				setDeletingCredential(null);
				setOpen(false);
			}}
			title={'Delete Credential'}
			message={deletingCredential && `Are you sure you want to delete the ${deletingCredential?.platform} credential "${deletingCredential?.name}". This action cannot be undone.`}
		/>
		<ul role='list' className='grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8'>
			{credentials.map((credential) => (
				<li key={credential._id} className='rounded-xl border border-gray-200 dark:border-gray-900'>
					<div className='flex items-center gap-x-4 border-b border-gray-900/5 dark:bg-gray-900 bg-gray-50 p-6'>
						{platformIcons[credential.platform] || <KeyIcon height='24' />}
						<Link
							href={`/${resourceSlug}/credential/${credential._id}`}
							className='cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap'
						>
							{credential.name}
						</Link>
						{/*<img
							src={'/images/favicon.ico'}
							alt={session.name.charAt(0).toUpperCase()}
							className='h-12 w-12 flex-none rounded-lg bg-white object-cover ring-1 ring-gray-900/10 text-center font-bold'
						/>*/}
						{/*<div className='text-sm font-medium leading-6 text-gray-900'>{session.name}</div>*/}
						<div className='relative ml-auto'>
							<button className='-m-2.5 block p-2.5 text-gray-400 hover:text-gray-500'>
								<span className='sr-only'>Open options</span>
								<TrashIcon onClick={() => {
									setDeletingCredential(credential);
									setOpen(true);
								}} className='h-5 w-5' color='red' aria-hidden='true' />
							</button>
						</div>
					</div>
				</li>
			))}
		</ul>
	</>);
}
