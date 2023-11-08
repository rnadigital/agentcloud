import { Fragment, useState } from 'react';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import {
	EllipsisHorizontalIcon,
	KeyIcon,
} from '@heroicons/react/20/solid';
import * as API from '../api';
import { useRouter } from 'next/router';
import { useAccountContext } from '../context/account';
import { toast } from 'react-toastify';
function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

export default function CredentialCards({ credentials, fetchCredentials }: { credentials: any[], fetchCredentials?: any }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const resourceSlug = account.currentTeam;
	const router = useRouter();

	async function deleteCredential(credentialId) {
		API.deleteSession({
			_csrf: csrf,
			credentialId,
		}, () => {
			fetchCredentials();
			toast('Deleted credential');
		}, () => {
			toast.error('Error deleting credential');
		}, router);
	}

	return (
		<ul role='list' className='grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8'>
			{credentials.map((credential) => (
				<li key={credential._id} className='rounded-xl border border-gray-200 dark:border-gray-900'>
					<div className='flex items-center gap-x-4 border-b border-gray-900/5 dark:bg-gray-900 bg-gray-50 p-6'>
						<KeyIcon height='24' />
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
						<Menu as='div' className='relative ml-auto'>
							
							<Menu.Button className='-m-2.5 block p-2.5 text-gray-400 hover:text-gray-500'>
								<span className='sr-only'>Open options</span>
								<EllipsisHorizontalIcon className='h-5 w-5' aria-hidden='true' />
							</Menu.Button>
							<Transition
								as={Fragment}
								enter='transition ease-out duration-100'
								enterFrom='transform opacity-0 scale-95'
								enterTo='transform opacity-100 scale-100'
								leave='transition ease-in duration-75'
								leaveFrom='transform opacity-100 scale-100'
								leaveTo='transform opacity-0 scale-95'
							>
								<Menu.Items className='absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none'>
									<Menu.Item>
										{({ active }) => (
											<a
												href={`/${resourceSlug}/credential/${credential._id}`}
												className={classNames(
													active ? 'bg-gray-50' : '',
													'block px-3 py-1 text-sm leading-6 text-gray-900'
												)}
											>
											View
											</a>
										)}
									</Menu.Item>
									<Menu.Item>
										{({ active }) => (
											<button
												onClick={() => deleteCredential(credential._id)}
												className={classNames(
													active ? 'bg-gray-50' : '',
													'block px-3 py-1 text-sm leading-6 text-red-600 w-full text-left'
												)}
											>
											Delete
											</button>
										)}
									</Menu.Item>
								</Menu.Items>
							</Transition>
						</Menu>
					</div>
				</li>
			))}
		</ul>
	);
}
