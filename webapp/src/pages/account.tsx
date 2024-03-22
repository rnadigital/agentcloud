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

	// Add this function to handle setting plans
	async function setPlan(e, plan) {
		e.preventDefault();
		API.setPlanDebug({
			_csrf: csrf,
			plan: plan
		}, () => {
			refreshAccountContext();
		}, setError, router);
	}

	async function getPaymentLink(e) {
		e.preventDefault();
		API.getPaymentLink({
			_csrf: e.target._csrf.value,
		}, null, setError, router);
	}

	async function getPortalLink(e) {
		e.preventDefault();
		API.getPortalLink({
			_csrf: e.target._csrf.value,
		}, null, setError, router);
	}

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
					onClick={(e) => setPlan(e, 'Free')}
					className='inline-flex justify-center rounded-md bg-green-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-400'
				>
			Set Free Plan
				</button>
				<button
					onClick={(e) => setPlan(e, 'Pro')}
					className='inline-flex justify-center rounded-md bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-400'
				>
			Set Pro Plan
				</button>
				<button
					onClick={(e) => setPlan(e, 'Teams')}
					className='inline-flex justify-center rounded-md bg-yellow-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-400'
				>
			Set Teams Plan
				</button>
				<button
					onClick={(e) => setPlan(e, 'Enterprise')}
					className='inline-flex justify-center rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-400'
				>
			Set Enterprise Plan
				</button>
			</div>

			<div className='border-b dark:border-slate-400 pb-2 my-2 mt-20'>
				<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>Subscription Status</h3>
			</div>
			
			{!stripeCustomerId && <form onSubmit={getPaymentLink}>
				<input type='hidden' name='_csrf' value={csrf} />
				<div className='my-2 flex items-center justify-start gap-x-6'>
					<button
						type='submit'
						className='inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
					>
						Subscribe (test plan A)
					</button>
				</div>
			</form>}

			{!stripeCustomerId && <form onSubmit={getPaymentLink}>
				<input type='hidden' name='_csrf' value={csrf} />
				<div className='my-2 flex items-center justify-start gap-x-6'>
					<button
						type='submit'
						className='inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
					>
						Subscribe (test plan B)
					</button>
				</div>
			</form>}

			{stripeCustomerId && !stripeCancelled && <form onSubmit={getPortalLink}>
				<input type='hidden' name='_csrf' value={csrf} />
				<div className='mb-2 flex items-center justify-start gap-x-6'>
					<button
						type='submit'
						className='inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
					>
						Cancel subscription
					</button>
				</div>
			</form>}

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
