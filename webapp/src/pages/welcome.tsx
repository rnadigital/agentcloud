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

const TEAM_PARENT_LOCATIONS = ['agent', 'task', 'tool', 'datasource', 'model'];

export default function Welcome(props) {
	const [accountContext, refreshAccountContext, setSwitchingContext]: any = useAccountContext();
	const router = useRouter();
	const [error, setError] = useState();
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const { verifysuccess, noverify, changepassword } = router.query;
	const [_state, dispatch] = useState();
	const { account, csrf } = accountContext as any;
	const posthog = usePostHog();
	const { theme } = useThemeContext();

	useEffect(() => {
		setLoading(false);
	}, [accountContext.account]);

	async function switchTeam(orgId, teamId) {
		const splitLocation = location.pathname.split('/').filter(n => n);
		const foundResourceSlug = account.orgs.find(o =>
			o.teams.find(t => t.id.toString() === splitLocation[0])
		);
		let redirect = location.pathname;
		if (foundResourceSlug) {
			splitLocation.shift();
			if (splitLocation.length <= 1) {
				redirect = `/${teamId}/${splitLocation.join('/')}`;
			} else if (TEAM_PARENT_LOCATIONS.includes(splitLocation[0])) {
				redirect = `/${teamId}/${splitLocation[0]}s`;
			} else {
				redirect = `/${teamId}/apps`;
			}
		}
		const start = Date.now();

		try {
			setSwitchingContext(true);
			await API.switchTeam(
				{
					orgId,
					teamId,
					_csrf: csrf,
					redirect
				},
				res => {
					setTimeout(
						async () => {
							await refreshAccountContext();
							if (res.canCreateModel && (!res.teamData.llmModel || !res.teamData.embeddingModel)) {
								redirect = `/${teamId}/onboarding/configuremodels`;
							}
							dispatch(res);
							router.push(redirect);
						},
						600 + (Date.now() - start)
					);
				},
				setError,
				router
			);
		} catch (e) {
			console.error(e);
		}
	}

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

								<ul role='Orgs' className='flex w-full'>
									<div className='flex flex-col items-start justify-between w-full mt-2 my-2 px-3 py-4'>
										<ul role='Teams' className='w-full'>
											{accountContext.account.orgs.map((org: any) => (
												<>
													<li
														key={org.id}
														className='relative flex flex-col w-full justify-between px-4 py-5 my-3 sm:px-6 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-900 rounded-md'
													>
														<>
															<div className='flex min-w-0 gap-x-4'>
																<div className='min-w-0 flex-auto'>
																	<p className='text-sm text-gray-500'>{org.name}</p>
																	<p className='text-sm font-semibold leading-6 text-gray-900'>
																		<span className='absolute inset-x-0 -top-px bottom-0' />
																		{}
																	</p>
																</div>
															</div>
															{org.teams.map((team: any) => {
																// console.log('team',team	);
																// console.log('org', org);
																return (
																	<li
																		key={team.id}
																		className='relative flex text-md w-full justify-between items-end px-4 py-5 hover:bg-gray-50 sm:px-6'
																	>
																		<div
																			className='flex flex-row w-full shrink-0 items-center justify-between gap-x-2 hover:cursor-pointer'
																			onClick={() => {
																				switchTeam(org.id, team.id);
																			}}
																		>
																			<div className='hidden font-bold sm:flex sm:flex-col sm:items-end'>
																				<p className='text-sm leading-6 text-gray-900'>
																					{team.name}
																				</p>
																			</div>
																			{/* <div className='hidden sm:flex sm:flex-col sm:items-end'>
																		<p className='text-sm font-medium leading-6 text-gray-900'>
																			{Object.keys(team.permissions || {})?.length} Members
																		</p>
																	</div> */}

																			<div className='flex flex-row'>
																				{accountContext.account.currentTeam === team.id && (
																					<p className='text-sm text-gray-500'>
																						Currently Logged In
																					</p>
																				)}
																				<ArrowRightCircleIcon
																					aria-hidden='true'
																					className='h-5 w-5 flex-none text-indigo-600'
																				/>
																			</div>
																		</div>
																	</li>
																);
															})}
														</>
													</li>
												</>
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
