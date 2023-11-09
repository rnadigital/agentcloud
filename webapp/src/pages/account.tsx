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
	const { checkoutSession } = state;

	async function getPaymentLink(e) {
		e.preventDefault();
		API.getPaymentLink(null, setError, router);
	}

	useEffect(() => {
		if (!account) {
			API.getAccount(dispatch, setError, router);
		}
	}, []);
	
	if (!account) {
		return 'Loading...'; //TODO: loader
	}

	return (
		<>

			<Head>
				<title>Account</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<div className='border-b pb-2 my-2'>
				<h3 className='pl-2 font-semibold text-gray-900'>Account Settings</h3>
			</div>

			<p>Nothing here... yet.</p>

			<div className='border-b pb-2 my-2 mt-20'>
				<h3 className='pl-2 font-semibold text-gray-900'>Subscription Status</h3>
			</div>
			
			<form onSubmit={getPaymentLink}>
				<input type='hidden' name='_csrf' value={csrf} />
				<div className='mt-2 flex items-center justify-start gap-x-6'>
					<button
						type='submit'
						className='inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
					>
						Subscribe
					</button>
				</div>
			</form>

			<p>Subscribed: {checkoutSession ? `Yes (${checkoutSession._id})` : 'No'}</p>

		</>
	);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
