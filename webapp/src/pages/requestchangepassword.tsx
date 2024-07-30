import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';

import * as API from '../api';
import ErrorAlert from '../components/ErrorAlert';

export default function RequestChangePassword() {
	const router = useRouter();
	const [error, setError] = useState();
	const posthog = usePostHog();
	async function requestChangePassword(e) {
		e.preventDefault();
		const email = e.target.email.value;
		posthog.capture('requestChangePassword', {
			email
		});
		await API.requestChangePassword(
			{
				email
			},
			null,
			setError,
			router
		);
	}

	return (
		<>
			<Head>
				<title>Request Password Reset</title>
			</Head>

			<div className='flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8'>
				<div className='sm:mx-auto sm:w-full sm:max-w-md'>
					<img
						className='mx-auto h-16 w-auto'
						src='/images/agentcloud-mark-black-bg-trans.png'
						alt='Your Company'
						height={128}
						width={128}
					/>
					<h2 className='mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900'>
						Forgot password?
					</h2>
				</div>

				<div className='mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]'>
					<div className='bg-white dark:bg-slate-800 px-6 py-12 shadow sm:rounded-lg sm:px-12'>
						<form
							className='space-y-6'
							onSubmit={requestChangePassword}
							action='/forms/requestchangepassword'
							method='POST'
						>
							<div>
								<label
									htmlFor='email'
									className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
								>
									Email Address
								</label>
								<div className='mt-2'>
									<input
										id='email'
										name='email'
										type='text'
										autoComplete='email'
										required
										className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
									/>
								</div>
							</div>

							<div>
								<button
									type='submit'
									className='flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
								>
									Request password reset
								</button>
							</div>

							{error && <ErrorAlert error={error} />}
						</form>
					</div>

					<p className='mt-10 text-center text-sm text-gray-500'>
						Remembered your password?{' '}
						<Link
							href='/login'
							className='font-semibold leading-6 text-indigo-600 hover:text-indigo-500'
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</>
	);
}
