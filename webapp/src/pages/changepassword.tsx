import * as API from '@api';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import ButtonSpinner from 'components/ButtonSpinner';
import ErrorAlert from 'components/ErrorAlert';
import InputField from 'components/form/InputField';
import passwordPattern from 'lib/misc/passwordpattern';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export interface ChangePasswordFormValues {
	password: string;
}

export default function ChangePassword() {
	const router = useRouter();
	const [error, setError] = useState();
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const { control, handleSubmit } = useForm<ChangePasswordFormValues>();

	const { token } = router.query;

	async function changePassword(data: ChangePasswordFormValues) {
		setSubmitting(true);
		try {
			await API.changePassword(
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

	return (
		<>
			<Head>
				<title>Change Password</title>
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
					<h2 className='mt-6 text-center text-2xl font-bold leading-9 tracking-tight dark:text-white'>
						Forgot password?
					</h2>
				</div>

				<div className='mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]'>
					<div className='bg-white dark:bg-slate-800 px-6 py-12 shadow sm:rounded-lg sm:px-12'>
						{error && <ErrorAlert error={error} />}

						<form
							className='space-y-6'
							onSubmit={handleSubmit(changePassword)}
							action='/forms/changepassword'
							method='POST'
						>
							<div>
								<div className='relative mt-2'>
									<InputField<ChangePasswordFormValues>
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
										label='New Password'
										type='password'
										disabled={false}
									/>
								</div>
							</div>

							<div>
								<button
									type='submit'
									className='flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
								>
									{submitting && <ButtonSpinner className='mt-1 me-1' />}
									Reset Password
								</button>
							</div>
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
