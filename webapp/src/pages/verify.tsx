import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
// TODO: Remove once https://github.com/vercel/next.js/issues/52216 is resolved.
// `next/image` seems to be affected by a default + named export bundling bug.
let ResolvedImage: any = Image;
if ('default' in ResolvedImage) {
	ResolvedImage = ResolvedImage.default;
}
import {
	EnvelopeIcon,
} from '@heroicons/react/24/outline';
import * as API from '../api';
import ErrorAlert from '../components/ErrorAlert';
import React, { useState, useEffect } from 'react';

export default function Verify() {

	const router = useRouter();
	const [verified, setVerified] = useState(null);
	const [newPassword, setNewPassword] = useState('');
	const [error, setError] = useState();
	const { token, newpassword } = router.query;

	async function verifyToken(e) {
		e && e.preventDefault();
		await API.verifyToken({
			token,
			password: newPassword,
		}, null, setError, router);
	}

	useEffect(() => {
		if (verified === null && token && !newpassword) {
			verifyToken();
		}
	}, [token]);

	return (
		<>
			<Head>
				<title>Verify Account</title>
			</Head>

			<div className='flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8'>
				<div className='sm:mx-auto sm:w-full sm:max-w-md'>
					<img
						className='mx-auto h-16 w-auto'
						src='/images/favicon.ico'
						alt='Your Company'
						height={128}
						width={128}
					/>
					<h2 className='mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900'>
            			{newpassword ? 'Accept Invitation' : (token ? 'Verifying...' : 'Email Sent')}
					</h2>
				</div>

				<div className='mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]'>
					<div className='bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12'>
						{token
							? <>
								{error && <ErrorAlert error='Your login token was invalid or has expired.' />}
							</>
							: <>
								<div className='w-16 mx-auto'>
									<EnvelopeIcon />
								</div>
								<p className='text-center'>Please check your email and click the link we just sent you.</p>
							</>}

						{newpassword && <form onSubmit={verifyToken}>
							<div>
								<label htmlFor='password' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
	                 					New Password
								</label>
								<div className='mt-2 mb-4'>
									<input
										id='password'
										name='password'
										type='password'
										value={newPassword}
										onChange={e => setNewPassword(e.target.value)}
										required
										className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
									/>
								</div>
								<div>
									<button
										type='submit'
										className='flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
									>
	                  					Accept Invitation
									</button>
								</div>
							</div>
						</form>}
					</div>

					<p className='mt-10 text-center text-sm text-gray-500'>
						<Link href='/register' className='font-semibold leading-6 text-indigo-600 hover:text-indigo-500'>
              				Back to Login
						</Link>
					</p>
					
				</div>
			</div>

		</>
	);

}
