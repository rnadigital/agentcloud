import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import ErrorAlert from '../components/ErrorAlert';
import * as API from '../api';
import { useAccountContext } from '../context/account';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

export default function Account(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { resourceSlug } = router.query;

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

	useEffect(() => {
		if (!account) {
			API.getAccount(dispatch, setError, router);
		}
	}, [resourceSlug]);
	
	if (!account) {
		return 'Loading...'; //TODO: loader
	}

	const { stripeCustomerId, stripeEndsAt, stripeCancelled } = account?.stripe;

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
						Subscribe
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

			{/* TODO: change logic for showing yes/no */}
			<p>Subscribed: {stripeCustomerId ? 'Yes' : 'No'}</p>
			{stripeCustomerId && <p>Stripe Customer ID: <code>{stripeCustomerId}</code></p>}
			{stripeEndsAt && <p>Billing Period End: <code suppressHydrationWarning={true}>{new Date(stripeEndsAt).toLocaleString()}</code></p>}
			{stripeCancelled && <p>Stripe subscription cancelled.</p>}

		</>
	);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
