import * as API from '@api';
import {
	ArrowRightCircleIcon,
	ChevronRightIcon,
	EyeIcon,
	EyeSlashIcon
} from '@heroicons/react/24/outline';
import ButtonSpinner from 'components/ButtonSpinner';
import ErrorAlert from 'components/ErrorAlert';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { useThemeContext } from 'context/themecontext';
import passwordPattern from 'lib/misc/passwordpattern';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

export default function Welcome(props) {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const router = useRouter();
	const [error, setError] = useState();
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const { verifysuccess, noverify, changepassword } = router.query;
	const posthog = usePostHog();
	const { theme } = useThemeContext();

	useEffect(() => {
		setLoading(false);
	}, [accountContext.account]);

	if (loading) {
		return <Spinner />;
	}
	console.log('accountContext', accountContext);

	return (
		<>
			<Head>
				<title>Team Selection</title>
			</Head>

			<div className='flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8'>
				<div className='sm:mx-auto sm:w-full sm:max-w-md'>
					<img
						className='mx-auto h-16 w-auto sm:h-20'
						src={
							theme === 'dark'
								? '/images/agentcloud-full-white-bg-trans.png'
								: '/images/agentcloud-full-black-bg-trans.png'
						}
						alt='Your Company'
					/>
				</div>

				<div className='mt-8 sm:mx-auto sm:w-full sm:max-w-[650px]'>
					<div className='flex flex-col items-start justify-start bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-6 py-8 shadow sm:rounded-lg sm:px-8'>
						<h2 className='text-2xl font-bold leading-9 tracking-tight text-gray-900 mb-5 mt-2 dark:text-white'>
							Welcome back
						</h2>

						{accountContext.account && (
							<>
								<div className='text-md'>Teams for {accountContext.account.name}</div>

								<ul role='Orgs'>
									<div className='flex flex-col items-start justify-start w-full mt-2 my-2 px-3 py-4 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-900 rounded-md'>
										<ul role='Teams'>
											{accountContext.account.orgs.map((org: any) => (
												<li
													key={org.id}
													className='relative flex w-full justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6'
												>
													<div className='flex min-w-0 gap-x-4'>
														<div className='min-w-0 flex-auto'>
															<p className='text-sm font-semibold leading-6 text-gray-900'>
																<a>
																	<span className='absolute inset-x-0 -top-px bottom-0' />
																	{org.name}
																</a>
															</p>
														</div>
													</div>
													<div className='flex shrink-0 items-center gap-x-4'>
														<div className='hidden sm:flex sm:flex-col sm:items-end'>
															<p className='text-sm leading-6 text-gray-900'>{}</p>
														</div>
														<ArrowRightCircleIcon
															aria-hidden='true'
															className='h-5 w-5 flex-none text-indigo-600'
														/>
													</div>
												</li>
											))}
										</ul>
									</div>
								</ul>
							</>
						)}
					</div>
				</div>
			</div>
		</>
	);
}

export async function getServerSideProps({
	req,
	res,
	query,
	resolvedUrl,
	locale,
	locales,
	defaultLocale
}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
