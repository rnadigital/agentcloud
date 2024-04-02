import * as API from '@api';
import ErrorAlert from 'components/ErrorAlert';
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

	//TODO: move this to a lib (IF its useful in other files)
	const stripeMethods = [API.getPaymentLink, API.getPortalLink, API.changePlan];
	function createApiCallHandler(apiMethod) {
		return (e) => {
			e.preventDefault();
			apiMethod({
				_csrf: e.target._csrf.value,
			}, null, setError, router);
		};
	}

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

	const [getPaymentLink, getPortalLink, changePlan, createPortalSession] = stripeMethods.map(createApiCallHandler);

	function fetchAccount() {
		API.getAccount({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchAccount();
	}, [resourceSlug]);
	
	if (!account) {
		return 'Loading...'; //TODO: loader
	}

	const { stripeCustomerId, stripeEndsAt, stripeCancelled, stripePlan } = account?.stripe || {};
	console.log(account?.stripe);

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
				<button
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
				</button>
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

			<div className='border-b dark:border-slate-400 pb-2 my-2 mt-20'>
				<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>Subscription Status</h3>
			</div>
			
			<form onSubmit={getPaymentLink}>
				<input type='hidden' name='_csrf' value={csrf} />
				<div className='my-2 flex items-center justify-start gap-x-6'>
					<button
						type='submit'
						className='inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
					>
						Subscribe
					</button>
				</div>
			</form>

			<form onSubmit={getPortalLink}>
				<input type='hidden' name='_csrf' value={csrf} />
				<div className='mb-2 flex items-center justify-start gap-x-6'>
					<button
						type='submit'
						className='inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
					>
						Manage subscription
					</button>
				</div>
			</form>

			<p>Subscribed: {stripeCustomerId ? 'Yes' : 'No'}</p>
			<p>Stripe Plan: <code>{stripePlan}</code></p>
			{stripeCustomerId && <p>Stripe Customer ID: <code>{stripeCustomerId}</code></p>}
			{stripeEndsAt && <p>Billing Period End: <code suppressHydrationWarning={true}>{new Date(stripeEndsAt).toLocaleString()}</code></p>}
			{stripeCancelled && <p>Stripe subscription cancelled.</p>}

		</>
	);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
