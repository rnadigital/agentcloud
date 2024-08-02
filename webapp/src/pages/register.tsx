import * as API from '@api';
import ButtonSpinner from 'components/ButtonSpinner';
import ErrorAlert from 'components/ErrorAlert';
import InputField from 'components/form/InputField';
import SuccessAlert from 'components/SuccessAlert';
import { useThemeContext } from 'context/themecontext';
import passwordPattern from 'lib/misc/passwordpattern';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

export interface RegisterFormValues {
	name: string;
	email: string;
	password: string;
	tos: boolean;
}

export default function Register() {
	const router = useRouter();
	const [error, setError] = useState();
	const [submitting, setSubmitting] = useState(false);
	const posthog = usePostHog();
	const { control, handleSubmit } = useForm<RegisterFormValues>();
	const { theme } = useThemeContext();

	async function register(data: RegisterFormValues) {
		setSubmitting(true);
		try {
			posthog.capture('signUp', {
				name: data.name,
				email: data.email
			});
			await API.register(data, null, setError, router);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<>
			<Head>
				<title>Register</title>
			</Head>

			<div className='flex min-h-full flex-1 flex-col justify-center sm:py-12 sm:px-6 lg:px-8'>
				<div className='sm:mx-auto sm:w-full sm:max-w-md'>
					<img
						className='mx-auto h-16 w-auto sm:h-20'
						src={
							theme === 'dark'
								? '/images/agentcloud-full-white-bg-trans.png'
								: '/images/agentcloud-full-black-bg-trans.png'
						}
						alt='Your Company'
						height={128}
						width={128}
					/>
				</div>

				<div className='mt-8 sm:mx-auto sm:w-full sm:max-w-[512px]'>
					<div className='bg-white dark:bg-slate-800 px-6 py-8 shadow sm:rounded-lg sm:px-8'>
						<h2 className='text-2xl font-bold leading-9 tracking-tight text-gray-900 mb-5 dark:text-white'>
							Create your account
						</h2>

						<form className='space-y-2' onSubmit={handleSubmit(register)}>
							<InputField<RegisterFormValues>
								name='name'
								control={control}
								rules={{
									required: 'Name is required'
								}}
								label='Name'
								type='text'
								disabled={false}
							/>

							<InputField<RegisterFormValues>
								name='email'
								control={control}
								rules={{
									required: 'Email is required',
									pattern: {
										value: /^\S+@\S+\.\S+$/,
										message: 'Invalid email address'
									}
								}}
								label='Email'
								type='email'
								disabled={false}
							/>

							<div className='relative mt-2'>
								<InputField<RegisterFormValues>
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
									label='Password'
									type='password'
									disabled={false}
								/>
							</div>

							<div className='flex items-center justify-start'>
								<label htmlFor='tos' className='block text-sm text-gray-900 dark:text-slate-100'>
									By using Agent Cloud, you agree to the{' '}
									<a
										href='https://www.agentcloud.dev/legal/terms'
										target='_blank'
										className='text-indigo-600'
										rel='noreferrer'
									>
										terms of service
									</a>{' '}
									and{' '}
									<a
										href='https://www.agentcloud.dev/legal/privacy'
										target='_blank'
										className='text-indigo-600'
										rel='noreferrer'
									>
										privacy policy
									</a>
									.
								</label>
							</div>

							<div>
								<button
									type='submit'
									className='flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mt-4'
								>
									{submitting && <ButtonSpinner className='mt-1 me-1' />}
									Create account
								</button>
							</div>

							{error && <ErrorAlert error={error} />}
						</form>

						<p className='mt-4 text-sm text-gray-900 dark:text-gray-50'>
							Already have an account?{' '}
							<Link
								href='/login'
								className='font-semibold leading-6 text-indigo-600 hover:text-indigo-500 dark:text-indigo-200'
							>
								Sign in
							</Link>
						</p>

						<div>
							<div className='relative mt-6'>
								<div className='absolute inset-0 flex items-center' aria-hidden='true'>
									<div className='w-full border-t border-gray-200' />
								</div>
								<div className='relative flex justify-center text-sm font-medium leading-6'>
									<span className='bg-white px-6 text-gray-500 dark:bg-slate-800 dark:text-gray-50'>
										or
									</span>
								</div>
							</div>

							<div className='mt-6 flex flex-col gap-4'>
								{process.env.NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH && (
									<Link
										href='/auth/google'
										className='flex w-full items-center justify-center gap-3 rounded-md px-3 py-1.5 text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4285F4] border border-gray-200'
									>
										<svg
											xmlns='http://www.w3.org/2000/svg'
											x='0px'
											y='0px'
											width='20'
											height='20'
											viewBox='0 0 48 48'
										>
											<path
												fill='#fbc02d'
												d='M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12   s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20    s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z'
											></path>
											<path
												fill='#e53935'
												d='M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039   l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z'
											></path>
											<path
												fill='#4caf50'
												d='M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z'
											></path>
											<path
												fill='#1565c0'
												d='M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571   c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z'
											></path>
										</svg>
										<span className='text-sm font-semibold leading-6 dark:text-gray-50'>
											Continue with Google
										</span>
									</Link>
								)}

								{process.env.NEXT_PUBLIC_ENABLE_GITHUB_OAUTH && (
									<Link
										href='/auth/github'
										className='flex w-full items-center justify-center gap-3 rounded-md bg-[#24292F] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24292F] dark:bg-slate-600'
									>
										<svg
											className='h-5 w-5'
											aria-hidden='true'
											fill='currentColor'
											viewBox='0 0 20 20'
										>
											<path
												fillRule='evenodd'
												d='M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z'
												clipRule='evenodd'
											/>
										</svg>
										<span className='text-sm font-semibold leading-6'>GitHub</span>
									</Link>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
