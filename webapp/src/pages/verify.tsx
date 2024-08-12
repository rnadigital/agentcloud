import { EnvelopeIcon } from '@heroicons/react/24/outline';
import ButtonSpinner from 'components/ButtonSpinner';
import InputField from 'components/form/InputField';
import { useThemeContext } from 'context/themecontext';
import passwordPattern from 'lib/misc/passwordpattern';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import * as API from '../api';
import ErrorAlert from '../components/ErrorAlert';

export interface VerifyFormValues {
	password: string;
	checkoutsession: any;
}

export default function Verify() {
	const router = useRouter();
	const [verified] = useState(null);
	const [newPassword, setNewPassword] = useState('');
	const [error, setError] = useState();
	const { token, newpassword, stripe, checkoutsession } = router.query;
	const [submitting, setSubmitting] = useState(false);
	const { control, handleSubmit } = useForm<VerifyFormValues>();
	const { theme } = useThemeContext();

	async function verifyToken(data: VerifyFormValues | { token: string | string[] }) {
		setSubmitting(true);
		try {
			await API.verifyToken(
				{
					...data,
					token
				},
				null,
				setError,
				router
			);
		} finally {
			setSubmitting(false);
		}
	}

	useEffect(() => {
		if (verified === null && (token || checkoutsession) && !newpassword) {
			verifyToken({
				token,
				checkoutsession
			});
		}
	}, [token, checkoutsession]);

	return (
		<>
			<Head>
				<title>Verify Account</title>
			</Head>

			<div className='flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8'>
				<div className='sm:mx-auto sm:w-full sm:max-w-md'>
					<img
						className='mx-auto h-16 w-auto'
						src={
							theme === 'dark'
								? '/images/agentcloud-mark-white-bg-trans.png'
								: '/images/agentcloud-mark-black-bg-trans.png'
						}
						alt='AgentCloud'
						height={128}
						width={128}
					/>
					<h2 className='mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white'>
						{stripe
							? 'Create Password'
							: newpassword
								? 'Accept Invitation'
								: token
									? 'Verifying...'
									: 'Email Sent'}
					</h2>
				</div>

				<div className='mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]'>
					<div className='bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12 space-y-4 dark:bg-slate-800 dark:text-white'>
						{token ? (
							<>
								{error && (
									<ErrorAlert error={error || 'Your login token was invalid or has expired.'} />
								)}
							</>
						) : (
							<>
								<div className='w-16 mx-auto'>
									<EnvelopeIcon />
								</div>
								<p className='text-center'>
									Please check your email and click the link we just sent you.
								</p>
							</>
						)}

						{newpassword && (
							<form onSubmit={handleSubmit(verifyToken)}>
								<div>
									<div className='mb-4'>
										<InputField<VerifyFormValues>
											name='password'
											control={control}
											rules={{
												required: 'Password is required',
												pattern: {
													value: passwordPattern,
													message:
														'Password must be at least 8 characters long and contain at least one letter, one number, and one special character'
												}
											}}
											label={stripe ? 'Password' : 'New Password'}
											type='password'
											disabled={false}
										/>
									</div>
									<div>
										<button
											type='submit'
											className='flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
											disabled={submitting}
										>
											{submitting && <ButtonSpinner className='mt-1 me-1' />}
											{stripe != null ? 'Save' : 'Accept Invitation'}
										</button>
									</div>
								</div>
							</form>
						)}
					</div>

					<p className='mt-10 text-center text-sm text-gray-500'>
						<Link
							href='/login'
							className='font-semibold leading-6 text-indigo-600 hover:text-indigo-500'
						>
							Back to Login
						</Link>
					</p>
				</div>
			</div>
		</>
	);
}
