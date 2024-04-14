import * as API from '@api';
import ErrorAlert from 'components/ErrorAlert';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function Account(props) {

	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { resourceSlug } = router.query;

	// Add this function to handle setting plans
	async function adminEditAction(e, action) {
		e.preventDefault();
		API.adminEditAccount({
			_csrf: csrf,
			action,
		}, () => {
			refreshAccountContext();
		}, setError, router);
	}

	function fetchAccount() {
		API.getAccount({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchAccount();
	}, [resourceSlug]);

	if (!account) {
		return <Spinner />;
	}

	return (
		<>

			<Head>
				<title>Account</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<div className='border-b dark:border-slate-400 pb-2 my-2'>
				<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>Account Settings</h3>
			</div>

			<p>Nothing here... yet.</p>

			<div className='my-2 flex flex-wrap items-center justify-start gap-x-6 gap-y-2'>
				{/*<button
					onClick={(e) => adminEditAction(e, 'Free')}
					className='inline-flex justify-center rounded-md bg-green-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-400'
				>
					Set Free Plan
				</button>
				<button
					onClick={(e) => adminEditAction(e, 'Pro')}
					className='inline-flex justify-center rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-400'
				>
					Set Pro Plan
				</button>
				<button
					onClick={(e) => adminEditAction(e, 'Teams')}
					className='inline-flex justify-center rounded-md bg-yellow-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-400'
				>
					Set Teams Plan
				</button>
				<button
					onClick={(e) => adminEditAction(e, 'Enterprise')}
					className='inline-flex justify-center rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-400'
				>
					Set Enterprise Plan
				</button>*/}
				<button
					onClick={(e) => adminEditAction(e, 'Root')}
					className='inline-flex justify-center rounded-md bg-purple-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-400'
				>
					Set ROOT Permissions
				</button>
				<button
					onClick={(e) => adminEditAction(e, 'Default')}
					className='inline-flex justify-center rounded-md bg-gray-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-400'
				>
					Set Default Permissions
				</button>
			</div>

		</>
	);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
