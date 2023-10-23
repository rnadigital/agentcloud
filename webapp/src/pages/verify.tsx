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
	const [error, setError] = useState();
	const { token } = router.query;

	async function verifyToken() {
		await API.verifyToken({
			token,
		}, null, setError, router);
	}

	useEffect(() => {
		if (verified === null && token) {
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
            			Verify your Email
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
									<EnvelopeIcon></EnvelopeIcon>
								</div>
								<p className='text-center'>Please verify your email address by clicking the link we just sent to your inbox.</p>
							</>}
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
