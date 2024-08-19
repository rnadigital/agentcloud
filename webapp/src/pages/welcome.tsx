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
	const [state, dispatch] = useState(props);
	const { teamMembers } = state;
	const { account, csrf } = accountContext || {};
	const [currentTeam, _] = useState(account?.currentTeam);
	const posthog = usePostHog();
	const { theme } = useThemeContext();

	async function fetchWelcomeData() {
		await API.getWelcomeData(dispatch, setError, router);
	}
	useEffect(() => {
		fetchWelcomeData();
		setLoading(false);
	}, []);

	async function switchTeam(orgId, teamId) {
		const splitLocation = location.pathname.split('/').filter(n => n);
		const foundResourceSlug = account.orgs.find(o =>
			o.teams.find(t => t.id.toString() === splitLocation[0])
		);
		let redirect = `/${teamId}/apps`;
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
							// dispatch(res);
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

	if (loading || !teamMembers) {
		return <Spinner />;
	}

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

				<div className='mt-8 sm:mx-auto sm:w-full sm:max-w-[750px]'>
					<div className='flex flex-col items-start justify-start bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-6 py-8 shadow rounded-2xl md:rounded-lg sm:px-8'>
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
																	<p className='text-xs text-gray-500 md:text-sm'>{org.name}</p>
																</div>
															</div>
															{org.teams.map((team: any) => {
																return (
																	<li
																		key={team.id}
																		className='relative flex text-md w-full justify-between items-center px-4 py-5 sm:text-sm hover:bg-gray-50 sm:px-6'
																	>
																		<div
																			className='grid grid-cols-2 gap-3 w-full shrink-0 items-center justify-start hover:cursor-pointer'
																			onClick={() => {
																				switchTeam(org.id, team.id);
																			}}
																		>
																			<div className='flex flex-col md:flex-row md:justify-between'>
																				<div className='font-bold flex flex-col md:flex-row'>
																					<p className='text-sm max-w-48 md:text-sm text-gray-900 truncate'>
																						{team.name}
																					</p>
																				</div>
																				<div className='flex flex-col md:flex-row justify-end'>
																					<p className='text-sm text-gray-900'>
																						{teamMembers[team.id] > 1 ? (
																							<p>{teamMembers[team.id]} Members</p>
																						) : (
																							<p>{teamMembers[team.id]} Member</p>
																						)}
																					</p>
																				</div>
																			</div>

																			<div className='flex flex-row justify-end gap-2'>
																				{currentTeam === team.id ? (
																					<p className='text-sm text-gray-500'>
																						Currently Logged In
																					</p>
																				) : (
																					<p className='text-sm text-indigo-600'>Select</p>
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
