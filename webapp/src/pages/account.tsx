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
	console.log('account', account);
	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	async function handleSubmit(e) {
		e.preventDefault();
		API.setAccountToken({
			_csrf: e.target._csrf.value,
			token: e.target.token.value,
		}, (res) => {
			dispatch(res);
			toast.success('Updated token');
		}, setError, router);
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

			<form onSubmit={handleSubmit}>
				<input type='hidden' name='_csrf' value={csrf} />
				<div>
					<label htmlFor='token' className='block text-sm font-medium leading-6 text-gray-900'>
						OpenAI API Token
					</label>
					<div className='mt-2 sm:col-span-2 sm:mt-0'>
						<input
							type='password'
							name='token'
							id='token'
							className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xl sm:text-sm sm:leading-6'
							defaultValue={account?.token || ''}
						/>
					</div>
				</div>
				<div className='mt-2 flex items-center justify-start gap-x-6'>
					<button
						type='submit'
						className='inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
					>
						Save
					</button>
				</div>
			</form>

		</>
	);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
