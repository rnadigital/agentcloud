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
	EyeIcon,
	EyeSlashIcon,
} from '@heroicons/react/24/outline';
import * as API from '../api';
import ErrorAlert from '../components/ErrorAlert';
import SuccessAlert from '../components/SuccessAlert';
import InfoAlert from '../components/InfoAlert';
import { useState } from 'react';

export default function Login() {

	const router = useRouter();
	const [error, setError] = useState();
	const [showPassword, setShowPassword] = useState(false);
	const { verifysuccess, noverify, changepassword } = router.query;

	async function login(e) {
		e.preventDefault();
		await API.login({
			email: e.target.email.value,
			password: e.target.password.value,
		}, null, setError, router);
	}

	return (
		<>
			<Head>
				<title>Login</title>
			</Head>

			<div className='flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8'>
				<div className='sm:mx-auto sm:w-full sm:max-w-md'>
					<img
						className='mx-auto h-16 w-auto'
						src='/images/favicon.ico'
						alt='Agent Cloud'
						height={128}
						width={128}
					/>
					<h2 className='mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900'>
            			Sign in to Agent Cloud
					</h2>
				</div>

				<div className='mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]'>
					<div className='bg-white dark:bg-slate-800 px-6 pb-6 py-12 shadow sm:rounded-lg sm:px-12'>
						<form className='space-y-6' onSubmit={login} action='/forms/login' method='POST'>

							{verifysuccess && <SuccessAlert message='Email verified, you may now sign in.' />}
							{changepassword && <SuccessAlert message='Password updated, you may now sign in.' />}
							
							{noverify && <InfoAlert message='Email verification skipped because you are missing secret manager credentials.' />}

							<div>
								<label htmlFor='email' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
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
								<label htmlFor='password' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
                  					Password
								</label>
								<div className='relative mt-2'>
									<input
										id='password'
										name='password'
										type={showPassword ? 'text' : 'password'}
										required
										className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
									/>
									<div onClick={() => setShowPassword(o => !o)} className='cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3'>
										{showPassword
											? <EyeIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
											: <EyeSlashIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />}
									</div>
								</div>
							</div>

							<div className='flex items-center justify-end' style={{ marginTop: 10 }}>
								<div className='leading-6 text-sm'>
									<Link href='/requestchangepassword' className='font-semibold text-indigo-600 hover:text-indigo-500'>
                    					Forgot password?
									</Link>
								</div>
							</div>

							<div>
								<button
									type='submit'
									className='flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
								>
                  					Sign in
								</button>
							</div>

							<div className='flex items-center justify-center'>
								<div className='flex items-center'>
									<label htmlFor='tos' className='-mx-5 block text-sm leading-6 text-gray-900 dark:text-slate-400'>
                   						By signing in, you agree to the <a href='https://www.agentcloud.dev/legal/terms' target='_blank' className='text-indigo-600' rel='noreferrer'>terms of service</a> and <a href='https://www.agentcloud.dev/legal/privacy' target='_blank' className='text-indigo-600' rel='noreferrer'>privacy policy</a>.
									</label>
								</div>
							</div>

							{error && <ErrorAlert error={error} />}
							
						</form>

						{(process.env.NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH || process.env.NEXT_PUBLIC_ENABLE_GITHUB_OAUTH) && <div>
							<div className='relative mt-10'>
								<div className='absolute inset-0 flex items-center' aria-hidden='true'>
									<div className='w-full border-t border-gray-200' />
								</div>
								<div className='relative flex justify-center text-sm font-medium leading-6'>
									<span className='bg-white px-6 text-gray-900'>Or continue with</span>
								</div>
							</div>

							<div className={`mt-6 grid grid-cols-${process.env.NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH && process.env.NEXT_PUBLIC_ENABLE_GITHUB_OAUTH ? '2' : '1'} gap-4`}>

								{process.env.NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH && <Link
									href='/auth/google'
									className='flex w-full items-center justify-center gap-3 rounded-md bg-[#4285F4] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4285F4]'
								>
									<svg
										viewBox='0 0 1024 1024'
										fill='currentColor'
										className='h-5 w-5'
									>
										<path d='M881 442.4H519.7v148.5h206.4c-8.9 48-35.9 88.6-76.6 115.8-34.4 23-78.3 36.6-129.9 36.6-99.9 0-184.4-67.5-214.6-158.2-7.6-23-12-47.6-12-72.9s4.4-49.9 12-72.9c30.3-90.6 114.8-158.1 214.7-158.1 56.3 0 106.8 19.4 146.6 57.4l110-110.1c-66.5-62-153.2-100-256.6-100-149.9 0-279.6 86-342.7 211.4-26 51.8-40.8 110.4-40.8 172.4S151 632.8 177 684.6C240.1 810 369.8 896 519.7 896c103.6 0 190.4-34.4 253.8-93 72.5-66.8 114.4-165.2 114.4-282.1 0-27.2-2.4-53.3-6.9-78.5z' />
									</svg>
									<span className='text-sm font-semibold leading-6'>Google</span>
								</Link>}

								{process.env.NEXT_PUBLIC_ENABLE_GITHUB_OAUTH && <Link
									href='/auth/github'
									className='flex w-full items-center justify-center gap-3 rounded-md bg-[#24292F] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24292F]'
								>
									<svg className='h-5 w-5' aria-hidden='true' fill='currentColor' viewBox='0 0 20 20'>
										<path
											fillRule='evenodd'
											d='M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z'
											clipRule='evenodd'
										/>
									</svg>
									<span className='text-sm font-semibold leading-6'>GitHub</span>
								</Link>}
								
							</div>
						</div>}
					</div>

					<p className='mt-10 text-center text-sm text-gray-500'>
            			Don&apos;t have an account?{' '}
						<Link href='/register' className='font-semibold leading-6 text-indigo-600 hover:text-indigo-500'>
              				Sign Up
						</Link>
					</p>
				</div>
			</div>

		</>
	);

}
