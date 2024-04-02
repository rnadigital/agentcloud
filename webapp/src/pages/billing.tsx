import * as API from '@api';
import ErrorAlert from 'components/ErrorAlert';
import StripePricingTable from 'components/StripePricingTable';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function Billing(props) {

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
				<title>Billing</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<div className='border-b dark:border-slate-400 pb-2 my-2'>
				<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>Manage Subscription</h3>
			</div>
			
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

			<p>Debugging info:</p>
			<p>Subscribed: {stripeCustomerId ? 'Yes' : 'No'}</p>
			<p>Stripe Plan: <code>{stripePlan}</code></p>
			<p>Stripe Customer ID: <code>{stripeCustomerId}</code></p>
			{stripeEndsAt && <p>Billing Period End: <code suppressHydrationWarning={true}>{new Date(stripeEndsAt).toLocaleString()}</code></p>}
			{stripeCancelled && <p>Stripe subscription cancelled.</p>}

			<StripePricingTable />

		</>
	);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
