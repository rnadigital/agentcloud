import * as API from '@api';
import { Dialog, Menu, Switch, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import {
	ArrowPathIcon,
	ArrowRightOnRectangleIcon,
	Bars3Icon,
	BuildingOfficeIcon,
	CircleStackIcon,
	CpuChipIcon,
	CreditCardIcon,
	CubeIcon,
	KeyIcon,
	PencilSquareIcon,
	PuzzlePieceIcon,
	ServerStackIcon,
	UserGroupIcon,
	WrenchScrewdriverIcon,
	XMarkIcon
} from '@heroicons/react/24/outline';
import AgentAvatar from 'components/AgentAvatar';
import classNames from 'components/ClassNames';
import NotificationBell from 'components/NotificationBell';
import OrgSelector from 'components/OrgSelector';
import PreviewSessionList from 'components/PreviewSessionList';
import { SessionStatus } from 'components/SessionCards';
import TrialNag from 'components/TrialNag';
import { useAccountContext } from 'context/account';
import { useChatContext } from 'context/chat';
import { useDeveloperContext } from 'context/developer';
import { ThemeContext } from 'context/themecontext';
import Head from 'next/head';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { withRouter } from 'next/router';
import { useRouter } from 'next/router';
import Permissions from 'permissions/permissions';
import { usePostHog } from 'posthog-js/react';
import { Fragment, useContext, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import cn from 'utils/cn';

import packageJson from '../../package.json';

const noNavPages = [
	'/login',
	'/register',
	'/changepassword',
	'/requestchangepassword',
	'/verify',
	'/redirect',
	'/s/',
	'/onboarding',
	'/onboarding/configuremodels',
	'/welcome'
];

const isFullPages = ['/register', '/login', '/onboarding'];

const agentNavigation: any[] = [
	{
		name: 'Apps',
		href: '/apps',
		base: '/app',
		icon: <PuzzlePieceIcon className='h-6 w-6 shrink-0' aria-hidden='true' />
	},
	{
		name: 'Agents',
		href: '/agents',
		base: '/agent',
		icon: (
			<svg
				width='24'
				height='24'
				viewBox='0 0 24 24'
				fill='none'
				xmlns='http://www.w3.org/2000/svg'
			>
				<path
					d='M22.125 11.85C21.7125 11.5875 21.225 11.7375 20.9625 12.1125L16.9875 18.4125C16.9125 18.4875 16.8375 18.6 16.8 18.7125C16.725 18.825 16.6875 18.9375 16.6875 19.05L15.375 22.5L18 19.8375C18.075 19.7625 18.15 19.6875 18.225 19.6125C18.3 19.5375 18.375 19.425 18.4125 19.3125L22.3875 13.0125C22.6125 12.6 22.5 12.075 22.125 11.85Z'
					fill='currentColor'
				/>
				<path
					d='M13.35 19.05C12.15 19.35 10.9125 19.5375 9.75 19.5375C7.0125 19.5375 4.425 18.525 3.1875 17.9625C3.3375 15.9 4.0125 14.025 5.175 12.6375C6.375 11.2125 8.025 10.425 9.75 10.425C11.475 10.425 13.125 11.2125 14.325 12.6375C14.9625 13.3875 15.45 14.2875 15.7875 15.3C15.9375 15.75 16.425 15.975 16.8375 15.825C17.2875 15.675 17.5125 15.1875 17.3625 14.775C16.95 13.5375 16.35 12.45 15.6 11.55C14.625 10.3875 13.3875 9.56255 12.0375 9.11255C13.3875 8.32505 14.2875 6.86255 14.2875 5.21255C14.2875 2.70005 12.2625 0.675049 9.75 0.675049C7.2375 0.675049 5.2125 2.70005 5.2125 5.21255C5.2125 6.86255 6.1125 8.32505 7.4625 9.11255C6.1125 9.56255 4.9125 10.3875 3.9 11.55C2.4 13.3125 1.575 15.7875 1.5 18.4501C1.5 18.7875 1.6875 19.0875 1.95 19.2375C2.8875 19.6875 6.1875 21.225 9.75 21.225C11.0625 21.225 12.4125 21.0375 13.7625 20.7001C14.2125 20.5875 14.475 20.1375 14.3625 19.6875C14.25 19.2 13.8 18.9375 13.35 19.05ZM9.75 2.36255C11.325 2.36255 12.6 3.63755 12.6 5.21255C12.6 6.78755 11.325 8.06255 9.75 8.06255C8.175 8.06255 6.9 6.78755 6.9 5.21255C6.9 3.63755 8.175 2.36255 9.75 2.36255Z'
					fill='currentColor'
				/>
			</svg>
		)
	},
	{
		name: 'Tasks',
		href: '/tasks',
		base: '/task',
		icon: <PencilSquareIcon className='h-6 w-6 shrink-0' aria-hidden='true' />
	},
	{
		name: 'Tools',
		href: '/tools',
		base: '/tool',
		icon: <WrenchScrewdriverIcon className='h-6 w-6 shrink-0' aria-hidden='true' />
	},
	{
		name: 'Data Sources',
		href: '/datasources',
		base: '/datasource',
		icon: <CircleStackIcon className='h-6 w-6 shrink-0' aria-hidden='true' />
	},
	{
		name: 'Models',
		href: '/models',
		base: '/model',
		icon: <CpuChipIcon className='h-6 w-6 shrink-0' aria-hidden='true' />
	},
	{
		name: 'Variables',
		href: '/variables',
		base: '/variable',
		icon: <CubeIcon className='h-6 w-6 shrink-0' aria-hidden='true' />
	},
	{
		name: 'Vector DBs',
		href: '/vectordbs',
		base: '/vectordb',
		icon: <ServerStackIcon className='h-6 w-6 shrink-0' aria-hidden='true' />
	}
	// { name: 'Vector Collections', href: '/collections', icon: <Square3Stack3DIcon className='h-6 w-6 shrink-0' aria-hidden='true' /> },
];

const teamNavigation = [
	{
		name: 'Organisation',
		href: '/org',
		base: '/org',
		icon: <BuildingOfficeIcon className='h-6 w-6 shrink-0' aria-hidden='true' />,
		permissions: [Permissions.ORG_OWNER, Permissions.ORG_ADMIN, Permissions.EDIT_ORG]
	},
	{
		name: 'Team',
		href: '/team',
		base: '/team',
		icon: <UserGroupIcon className='h-6 w-6 shrink-0' aria-hidden='true' />,
		permissions: [
			Permissions.TEAM_OWNER,
			Permissions.TEAM_ADMIN,
			Permissions.EDIT_TEAM,
			Permissions.EDIT_TEAM_MEMBER,
			Permissions.ADD_TEAM_MEMBER,
			Permissions.REMOVE_TEAM_MEMBER
		]
	}
];

const userNavigation = [
	//{ name: 'My Account', href: '/account' },
	{ name: 'Billing', href: '/billing' },
	{ name: 'Theme', href: '#', theme: true },
	{ name: 'Developer Mode', href: '#', developer: true },
	{ name: 'Sign out', href: '#', logout: true }
];

export default withRouter(function Layout(props) {
	const [chatContext]: any = useChatContext();
	const [accountContext]: any = useAccountContext();
	const { account, csrf, switching } = accountContext as any;
	const { children } = props as any;
	const router = useRouter();
	const { developerMode, toggleDeveloperMode } = useDeveloperContext();
	const posthog = usePostHog();
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;
	const currentOrg = account?.orgs?.find(o => o.id === account?.currentOrg);
	const isOrgOwner = currentOrg?.ownerId === account?._id;
	const path = usePathname();
	const showNavs = account && !noNavPages.some(p => path.includes(p));
	const { toggleTheme, toggleUseSystemTheme } = useContext(ThemeContext);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const orgs = account?.orgs || [];
	const scrollRef = useRef(null);

	//this is temporary, will be removed once other pages are updated
	const isRegisteringPage = Array.isArray(path) ? isFullPages.some(p => path.includes(p)) : false;

	if (!account) {
		// return 'Loading...'; //TODO: loader?
	}

	const restartSession = () => {
		posthog.capture('restartSession', {
			appId: chatContext?.app._id,
			appType: chatContext?.app.type,
			appName: chatContext?.app.name
		});
		API.addSession(
			{
				_csrf: csrf,
				resourceSlug,
				id: chatContext?.app?._id
			},
			null,
			toast.error,
			router
		);
	};

	return (
		<>
			<Head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width initial-scale=1' />
				<link rel='shortcut icon' href='/images/favicon.ico' />
			</Head>
			<div className='flex flex-col flex-1 bg-gray-50 dark:bg-gray-900'>
				<Transition.Root show={sidebarOpen} as={Fragment}>
					<Dialog as='div' className='relative z-50 lg:hidden' onClose={setSidebarOpen}>
						<Transition.Child
							as={Fragment}
							enter='transition-opacity ease-linear duration-300'
							enterFrom='opacity-0'
							enterTo='opacity-100'
							leave='transition-opacity ease-linear duration-300'
							leaveFrom='opacity-100'
							leaveTo='opacity-0'
						>
							<div className='fixed inset-0 bg-gray-900/80' />
						</Transition.Child>

						<div className='fixed inset-0 flex'>
							<Transition.Child
								as={Fragment}
								enter='transition ease-in-out duration-300 transform'
								enterFrom='-translate-x-full'
								enterTo='translate-x-0'
								leave='transition ease-in-out duration-300 transform'
								leaveFrom='translate-x-0'
								leaveTo='-translate-x-full'
							>
								<Dialog.Panel className='relative mr-16 flex w-full max-w-xs flex-1'>
									<Transition.Child
										as={Fragment}
										enter='ease-in-out duration-300'
										enterFrom='opacity-0'
										enterTo='opacity-100'
										leave='ease-in-out duration-300'
										leaveFrom='opacity-100'
										leaveTo='opacity-0'
									>
										<div className='absolute left-full top-0 flex w-16 justify-center pt-5'>
											<button
												type='button'
												className='-m-2.5 p-2.5'
												onClick={() => setSidebarOpen(false)}
											>
												<span className='sr-only'>Close sidebar</span>
												<XMarkIcon className='h-6 w-6 text-white' aria-hidden='true' />
											</button>
										</div>
									</Transition.Child>
									{/* Sidebar component, swap this element with another sidebar if you like */}
									{showNavs && (
										<div className='flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 ring-1 ring-white/10'>
											<div className='flex mt-4 h-16 shrink-0 items-center'>
												<img
													src='/images/agentcloud-full-white-bg-trans.png'
													alt='Agentcloud'
													width={200}
													height={150}
												/>
											</div>
											{resourceSlug && (
												<nav className='flex flex-1 flex-col'>
													<div className='text-xs font-semibold leading-6 text-indigo-200'>
														Teams
													</div>
													<ul role='list' className='flex flex-1 flex-col gap-y-7'>
														<li key='orgselector'>
															<ul role='list' className='-mx-2 mt-2 space-y-1'>
																<OrgSelector orgs={orgs} />
															</ul>
														</li>
														<li key='agentnavigation'>
															{agentNavigation.length > 0 && (
																<div className='text-xs font-semibold leading-6 text-indigo-200'>
																	Platform
																</div>
															)}
															<ul role='list' className='-mx-2 space-y-1'>
																{agentNavigation.map(item => {
																	return (
																		<li key={item.name}>
																			<Link
																				suppressHydrationWarning
																				href={`/${resourceSlug}${item.href}`}
																				className={classNames(
																					path.endsWith(item.href) ||
																						path.startsWith(`/${resourceSlug}${item.base}`)
																						? 'bg-gray-800 text-white'
																						: 'text-gray-400 hover:text-white hover:bg-gray-800',
																					'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
																				)}
																			>
																				{item.icon}
																				{item.name}
																			</Link>
																		</li>
																	);
																})}
																<PreviewSessionList scrollRef={scrollRef} />
															</ul>
														</li>
														<li className='bg-gray-900 w-full mt-auto absolute bottom-0 left-0 p-4 ps-6'>
															{teamNavigation.length > 0 && (
																<div className='text-xs font-semibold leading-6 text-indigo-200'>
																	Account{' '}
																</div>
															)}
															<ul role='list' className='-mx-2 mt-2 space-y-1'>
																<li key='apikeys'>
																	<Link
																		href='/apikeys'
																		className={classNames(
																			path.endsWith('/apikeys')
																				? 'bg-gray-800 text-white'
																				: 'text-gray-400 hover:text-white hover:bg-gray-800',
																			'w-full group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white'
																		)}
																	>
																		<KeyIcon className='h-6 w-6 shrink-0' aria-hidden='true' />
																		API Keys
																	</Link>
																</li>
																{teamNavigation.map(item => (
																	<li key={item.name}>
																		<Link
																			key={`link_${item.name}`}
																			suppressHydrationWarning
																			href={`/${resourceSlug}${item.href}`}
																			className={classNames(
																				path.endsWith(item.href) ||
																					path.startsWith(`/${resourceSlug}${item.base}`)
																					? 'bg-gray-800 text-white'
																					: 'text-gray-400 hover:text-white hover:bg-gray-800',
																				'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
																			)}
																		>
																			{item.icon}
																			{item.name}
																		</Link>
																	</li>
																))}
																{/* <li key='account'>
															<Link
																href='/account'
																className={classNames(
																	path === '/account'
																		? 'bg-gray-800 text-white'
																		: 'text-gray-400 hover:text-white hover:bg-gray-800',
																	'w-full group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white'
																)}
															>
																<UserIcon
																	className='h-6 w-6 shrink-0'
																	aria-hidden='true'
																/>
																Account
															</Link>
														</li> */}
																{isOrgOwner && (
																	<li key='billing'>
																		<Link
																			href='/billing'
																			className={classNames(
																				path === '/billing'
																					? 'bg-gray-800 text-white'
																					: 'text-gray-400 hover:text-white hover:bg-gray-800',
																				'w-full group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white'
																			)}
																		>
																			<CreditCardIcon
																				className='h-6 w-6 shrink-0'
																				aria-hidden='true'
																			/>
																			Billing
																		</Link>
																	</li>
																)}
																{/*<li>
															<Link
																href='/settings'
																className={classNames(
																	path.endsWith('/settings')
																		? 'bg-gray-800 text-white'
																		: 'text-gray-400 hover:text-white hover:bg-gray-800',
																	'w-full group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white'
																)}
															>
																<Cog6ToothIcon
																	className='h-6 w-6 shrink-0'
																	aria-hidden='true'
																/>
																Settings
															</Link>
														</li>*/}

																<li key='logout'>
																	<button
																		className='w-full group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white'
																		onClick={() => {
																			posthog.capture('logout', {
																				email: account?.email
																			});
																			API.logout(
																				{
																					_csrf: csrf
																				},
																				null,
																				null,
																				router
																			);
																		}}
																	>
																		<ArrowRightOnRectangleIcon
																			className='h-6 w-6 shrink-0'
																			aria-hidden='true'
																		/>
																		Log out
																	</button>
																</li>
															</ul>
															<TrialNag />
														</li>
													</ul>
												</nav>
											)}
										</div>
									)}
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</Dialog>
				</Transition.Root>

				{/* Static sidebar for desktop */}
				{showNavs && (
					<div className='hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col'>
						{/* Sidebar component, swap this element with another sidebar if you like */}
						<div
							className='flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 dark:border-r dark:border-slate-600 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-gray-900'
							ref={scrollRef}
						>
							<div className='bg-gray-900 h-24 fixed z-50 w-[286px] left-0'>
								<img
									className='mx-auto'
									src='/images/agentcloud-full-white-bg-trans.png'
									alt='Your Company'
									width={200}
									height={150}
								/>
							</div>
							{resourceSlug && (
								<nav className='flex flex-1 flex-col mt-24'>
									<div className='text-xs font-semibold leading-6 text-indigo-200'>Teams</div>
									<ul role='list' className='flex flex-1 flex-col gap-y-7'>
										<li>
											<ul role='list' className='-mx-2 mt-2 space-y-1'>
												<OrgSelector orgs={orgs} />
											</ul>
										</li>
										<li>
											{agentNavigation.length > 0 && (
												<div className='text-xs font-semibold leading-6 text-indigo-200'>
													Platform
												</div>
											)}
											<ul role='list' className='-mx-2 space-y-1'>
												{agentNavigation.map(item => {
													return (
														<li key={item.name}>
															<Link
																suppressHydrationWarning
																href={`/${resourceSlug}${item.href}`}
																className={classNames(
																	path.endsWith(item.href) ||
																		path.startsWith(`/${resourceSlug}${item.base}`)
																		? 'bg-gray-800 text-white'
																		: 'text-gray-400 hover:text-white hover:bg-gray-800',
																	'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
																)}
															>
																{item.icon}
																{item.name}
															</Link>
														</li>
													);
												})}
												<PreviewSessionList scrollRef={scrollRef} />
											</ul>
										</li>
									</ul>

									<span className='flex flex-col bg-gray-900 w-full absolute bottom-0 left-0 p-4 dark:border-r dark:border-slate-600 ps-6'>
										{teamNavigation.length > 0 && (
											<div className='text-xs font-semibold leading-6 text-indigo-200'>Admin</div>
										)}
										<ul role='list' className='-mx-2 mt-2 space-y-1'>
											<li key='apikeys'>
												<Link
													href='/apikeys'
													className={classNames(
														path.endsWith('/apikeys')
															? 'bg-gray-800 text-white'
															: 'text-gray-400 hover:text-white hover:bg-gray-800',
														'w-full group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white'
													)}
												>
													<KeyIcon className='h-6 w-6 shrink-0' aria-hidden='true' />
													API Keys
												</Link>
											</li>
											{teamNavigation.map(item => (
												<li key={item.name}>
													<Link
														suppressHydrationWarning
														href={`/${resourceSlug}${item.href}`}
														className={classNames(
															path.endsWith(item.href) ||
																path.startsWith(`/${resourceSlug}${item.base}`)
																? 'bg-gray-800 text-white'
																: 'text-gray-400 hover:text-white hover:bg-gray-800',
															'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
														)}
													>
														{item.icon}
														{item.name}
													</Link>
												</li>
											))}
											{/* <li>
										<Link
											href='/account'
											className={classNames(
												path.endsWith('/account')
													? 'bg-gray-800 text-white'
													: 'text-gray-400 hover:text-white hover:bg-gray-800',
												'w-full group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white'
											)}
										>
											<UserIcon
												className='h-6 w-6 shrink-0'
												aria-hidden='true'
											/>
											Account
										</Link>
									</li> */}
											{isOrgOwner && (
												<li key='billing'>
													<Link
														href='/billing'
														className={classNames(
															path.endsWith('/billing')
																? 'bg-gray-800 text-white'
																: 'text-gray-400 hover:text-white hover:bg-gray-800',
															'w-full group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white'
														)}
													>
														<CreditCardIcon className='h-6 w-6 shrink-0' aria-hidden='true' />
														Billing
													</Link>
												</li>
											)}
											{/*<li>
										<Link
											href='/settings'
											className={classNames(
												path.endsWith('/settings')
													? 'bg-gray-800 text-white'
													: 'text-gray-400 hover:text-white hover:bg-gray-800',
												'w-full group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white'
											)}
										>
											<Cog6ToothIcon
												className='h-6 w-6 shrink-0'
												aria-hidden='true'
											/>
											Settings
										</Link>
									</li>*/}
											<li>
												<button
													className='w-full group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white'
													onClick={() => {
														posthog.capture('logout', {
															email: account?.email
														});
														API.logout(
															{
																_csrf: csrf
															},
															null,
															null,
															router
														);
													}}
												>
													<ArrowRightOnRectangleIcon
														className='h-6 w-6 shrink-0'
														aria-hidden='true'
													/>
													Log out
												</button>
											</li>
										</ul>
										<TrialNag />
									</span>
								</nav>
							)}
						</div>
					</div>
				)}

				<div className={classNames(showNavs ? 'lg:pl-72' : '', 'flex flex-col flex-1')}>
					{/*<BillingBanner stripePlan={stripePlan} stripeEndsAt={stripeEndsAt} stripeCancelled={stripeCancelled} />
					[${(stripePlan && stripeEndsAt && (stripeEndsAt > Date.now())) ? 28 : 0}px]
					*/}
					{showNavs && (
						<div
							className={
								'sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 px-4 shadow-sm sm:gap-x-6 sm:px-4'
							}
						>
							<button
								type='button'
								className='-m-2.5 p-2.5 text-gray-700 lg:hidden'
								onClick={() => setSidebarOpen(true)}
							>
								<span className='sr-only'>Open sidebar</span>
								<Bars3Icon className='h-6 w-6' aria-hidden='true' />
							</button>

							{/* Separator */}
							<div className='h-6 w-px bg-gray-900/10 lg:hidden' aria-hidden='true' />

							{chatContext?.app?.name && (
								<h5 className='text-xl text-ellipsis overflow-hidden whitespace-nowrap flex items-center space-x-3'>
									<button
										onClick={restartSession}
										className='flex items-center p-2 space-x-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded dark:text-white'
									>
										<ArrowPathIcon className='h-5 w-5' aria-hidden='true' />
									</button>
									<span className='dark:text-white'>{chatContext.app.name}</span>
								</h5>
							)}

							<div className='flex flex-1 gap-x-4 self-stretch lg:gap-x-6'>
								{/*<form className='relative flex flex-1' action='#' method='GET'>
								<>
									<label htmlFor='search-field' className='sr-only'>
										Search
									</label>
									<MagnifyingGlassIcon
										className='pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400'
										aria-hidden='true'
									/>
									<input
										id='search-field'
										className='block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm'
										placeholder='Search...'
										type='search'
										name='search'
									/>
								</>
							</form>*/}
								<div className='flex flex-1 justify-end items-center'>
									{chatContext?.tokens ? (
										<span className='me-2 whitespace-nowrap cursor-pointer h-6 capitalize inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-200 dark:ring-slate-600 dark:bg-slate-800 dark:text-white'>
											<CreditCardIcon className='h-5 w-5' />
											Tokens used: {chatContext?.tokens || 0}
										</span>
									) : null}
									{chatContext?.status && chatContext?.type && (
										<span
											className='whitespace-nowrap cursor-pointer h-6 capitalize inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-200 dark:ring-slate-600 dark:bg-slate-800 dark:text-white'
											onClick={chatContext.scrollToBottom}
										>
											<svg
												className={`h-1.5 w-1.5 ${SessionStatus[chatContext.status]}`}
												viewBox='0 0 6 6'
												aria-hidden='true'
											>
												<circle cx={3} cy={3} r={3} />
											</svg>
											{chatContext.type && chatContext.type.replace('_', ' ')}: {chatContext.status}
										</span>
									)}
								</div>
								<div className='flex items-center gap-x-4 lg:gap-x-6'>
									{/* Notification Bell */}
									<NotificationBell />

									{/* Profile dropdown */}
									{account && (
										<Menu as='div' className='relative'>
											<Menu.Button className='flex items-center'>
												<span className='sr-only'>Open user menu</span>
												<AgentAvatar
													agent={{
														name: account.email,
														icon: {
															/* TODO */
														}
													}}
												/>
												<span className='hidden lg:flex lg:items-center ps-2'>
													<span
														className='text-sm font-semibold leading-6 text-gray-900 dark:text-white'
														aria-hidden='true'
													>
														{account.name}
													</span>
													<ChevronDownIcon
														className='ml-2 h-5 w-5 text-gray-400 dark:text-white'
														aria-hidden='true'
													/>
												</span>
											</Menu.Button>
											<Transition
												as={Fragment}
												enter='transition ease-out duration-100'
												enterFrom='transform opacity-0 scale-95'
												enterTo='transform opacity-100 scale-100'
												leave='transition ease-in duration-75'
												leaveFrom='transform opacity-100 scale-100'
												leaveTo='transform opacity-0 scale-95'
											>
												<Menu.Items className='absolute right-0 z-10 mt-2.5 w-64 origin-top-right rounded-md bg-white dark:bg-slate-800 py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none'>
													{account && (
														<div className='px-3 py-3 dark:text-white' key='accountdetails'>
															<p className='text-sm dark:text-gray-50'>Signed in as</p>
															<p className='truncate text-sm font-semibold text-gray-900 dark:text-white'>
																{account.email}
															</p>
														</div>
													)}
													{userNavigation.map(item => (
														<Menu.Item key={item.name}>
															{({ active }) => {
																if (item.logout) {
																	return (
																		<button
																			className={classNames(
																				active ? 'bg-gray-50 dark:bg-slate-700' : '',
																				'w-full text-left block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-white'
																			)}
																			onClick={() => {
																				posthog.capture('logout', {
																					email: account?.email
																				});
																				API.logout(
																					{
																						_csrf: csrf
																					},
																					null,
																					null,
																					router
																				);
																			}}
																		>
																			Log out
																		</button>
																	);
																}
																if (item.developer) {
																	return (
																		<>
																			<div className='flex items-center px-3 py-1.5'>
																				<span className='text-sm text-left mr-3 dark:text-white'>
																					{item.name}
																				</span>
																				<Switch
																					checked={developerMode}
																					onChange={() => toggleDeveloperMode()}
																					className='group relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-0 active:bg-transparent'
																				>
																					<span className='sr-only'>Use setting</span>
																					<span
																						aria-hidden='true'
																						className='pointer-events-none absolute h-full w-full rounded-md bg-white dark:bg-slate-800'
																					/>
																					<span
																						aria-hidden='true'
																						className='pointer-events-none absolute mx-auto h-5 w-10 rounded-full bg-gray-200 dark:bg-slate-700 transition-colors duration-200 ease-in-out group-data-[checked]:bg-indigo-600 dark:group-data-[checked]:bg-slate-500'
																					/>
																					<span
																						aria-hidden='true'
																						className='pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-400 shadow ring-0 transition-transform duration-200 ease-in-out group-data-[checked]:translate-x-5'
																					/>
																				</Switch>
																			</div>
																			<hr className='border-gray-200 dark:border-slate-700 mt-2' />
																		</>
																	);
																}
																//TODO: developer mode toggle
																if (item.theme) {
																	return (
																		<div className='flex flex-col space-y-2 py-2'>
																			<hr className='border-gray-200 dark:border-slate-700 mt-2 ' />

																			<p className='text-xs font-semibold text-gray-900 dark:text-white mt-2 px-3'>
																				Theme
																			</p>
																			<button
																				className='w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white'
																				onClick={() => toggleTheme('light')}
																			>
																				Light
																			</button>
																			<button
																				className='w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white'
																				onClick={() => toggleTheme('dark')}
																			>
																				Dark
																			</button>
																			<button
																				className='w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white'
																				onClick={() => toggleUseSystemTheme()}
																			>
																				System
																			</button>

																			<hr className='border-gray-200 dark:border-slate-700 mt-2 ' />
																		</div>
																	);
																}
																return (
																	<a
																		href={item.href}
																		className={classNames(
																			active ? 'bg-gray-50 dark:bg-slate-700' : '',
																			'block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-white'
																		)}
																	>
																		{item.name}
																	</a>
																);
															}}
														</Menu.Item>
													))}
												</Menu.Items>
											</Transition>
										</Menu>
									)}
								</div>
							</div>
						</div>
					)}
					{!isRegisteringPage ? (
						<main className='flex flex-col flex-1 py-8 sm:py-10'>
							<div className='px-4 sm:px-6 lg:px-8 flex flex-col flex-1'>{children}</div>
						</main>
					) : (
						<div className='flex flex-col flex-1'>{children}</div>
					)}
				</div>
			</div>
			<div
				className={`transition-all duration-300 bg-white z-40 fixed w-screen h-screen overflow-hidden opacity-1 pointer-events-none ${switching === false ? 'opacity-0' : ''} text-center ps-[280px] content-center`}
			>
				<img
					className='pulsate m-auto'
					src='/images/agentcloud-full-black-bg-trans.png'
					alt='Agentcloud'
					width={200}
					height={150}
				/>
				<em>Switching team...</em>
			</div>
			<div
				className={`transition-all duration-300 bg-gray-900 z-50 fixed w-[280px] h-screen overflow-hidden opacity-1 pointer-events-none ${switching === false ? 'opacity-0' : ''} text-center`}
			/>
			<div className={cn('flex bg-gray-50 w-full dark:bg-gray-800', { hidden: isRegisteringPage })}>
				<footer
					className={cn(
						'mt-auto text-gray-500 text-sm px-8 sm:flex items-center py-4 max-w-7xl w-full mx-auto',
						{ 'lg:pl-80 py-0 max-w-full': showNavs }
					)}
				>
					{/* <div className='py-3'>
						© {new Date().getFullYear()} RNA Digital - v{packageJson.version}
						{process.env.NEXT_PUBLIC_SHORT_COMMIT_HASH &&
							`-git-${process.env.NEXT_PUBLIC_SHORT_COMMIT_HASH}`}
					</div> */}
					<div className='flex gap-x-2 ml-auto'>
						<a
							href='https://discord.com/invite/ZNSSttKqqq'
							target='_blank'
							rel='noopener noreferrer'
							className=''
						>
							<svg
								width='32'
								height='24'
								viewBox='0 0 24 28'
								fill='none'
								xmlns='http://www.w3.org/2000/svg'
							>
								<path
									d='M23.6361 9.33998C22.212 8.71399 20.6892 8.25903 19.0973 8C18.9018 8.33209 18.6734 8.77875 18.5159 9.13408C16.8236 8.89498 15.1469 8.89498 13.4857 9.13408C13.3283 8.77875 13.0946 8.33209 12.8974 8C11.3037 8.25903 9.77927 8.71565 8.35518 9.3433C5.48276 13.4213 4.70409 17.3981 5.09342 21.3184C6.99856 22.6551 8.84487 23.467 10.66 23.9983C11.1082 23.4189 11.5079 22.8029 11.8523 22.1536C11.1964 21.9195 10.5683 21.6306 9.9748 21.2951C10.1323 21.1856 10.2863 21.071 10.4351 20.9531C14.0551 22.5438 17.9881 22.5438 21.5649 20.9531C21.7154 21.071 21.8694 21.1856 22.0251 21.2951C21.4299 21.6322 20.8 21.9211 20.1442 22.1553C20.4885 22.8029 20.8865 23.4205 21.3364 24C23.1533 23.4687 25.0013 22.6567 26.9065 21.3184C27.3633 16.7738 26.1261 12.8335 23.6361 9.33998ZM12.3454 18.9075C11.2587 18.9075 10.3676 17.9543 10.3676 16.7937C10.3676 15.6331 11.2397 14.6783 12.3454 14.6783C13.4511 14.6783 14.3422 15.6314 14.3232 16.7937C14.325 17.9543 13.4511 18.9075 12.3454 18.9075ZM19.6545 18.9075C18.5678 18.9075 17.6767 17.9543 17.6767 16.7937C17.6767 15.6331 18.5488 14.6783 19.6545 14.6783C20.7602 14.6783 21.6514 15.6314 21.6323 16.7937C21.6323 17.9543 20.7602 18.9075 19.6545 18.9075Z'
									fill='#6B7280'
								/>
							</svg>
						</a>
						<a
							href='https://www.linkedin.com/company/rna-digital/'
							target='_blank'
							rel='noopener noreferrer'
							className=''
						>
							<svg
								width='24'
								height='25'
								viewBox='0 0 24 25'
								fill='none'
								xmlns='http://www.w3.org/2000/svg'
							>
								<path
									fillRule='evenodd'
									clipRule='evenodd'
									d='M15.7984 9.50723C15.1519 9.47999 14.509 9.61063 13.9326 9.88631C13.3563 10.162 12.8664 10.5733 12.5109 11.0798V9.49524H9.34293V19.486H12.5333V14.6704C12.5333 13.3996 12.8448 12.1728 14.672 12.1728C16.5557 12.1728 16.8 13.6254 16.8 14.7544V19.486H20V14.1459C20 11.5234 19.2533 9.50723 15.7984 9.50723Z'
									fill='#6B7280'
								/>
								<path
									fillRule='evenodd'
									clipRule='evenodd'
									d='M5.6 5.48596C5.28355 5.48596 4.97421 5.57385 4.71109 5.73852C4.44797 5.90319 4.24289 6.13724 4.12179 6.41108C4.00069 6.68491 3.96901 6.98623 4.03074 7.27693C4.09248 7.56764 4.24487 7.83466 4.46863 8.04425C4.69239 8.25383 4.97749 8.39656 5.28786 8.45438C5.59823 8.51221 5.91993 8.48253 6.21229 8.3691C6.50466 8.25568 6.75454 8.0636 6.93035 7.81715C7.10616 7.57071 7.2 7.28097 7.2 6.98457C7.2 6.58711 7.03143 6.20594 6.73137 5.92489C6.43131 5.64385 6.02435 5.48596 5.6 5.48596Z'
									fill='#6B7280'
								/>
								<path d='M7.2 9.50723H4V19.486H7.2V9.50723Z' fill='#6B7280' />
							</svg>
						</a>
						<a
							href='https://www.youtube.com/@monitapixels'
							target='_blank'
							rel='noopener noreferrer'
							className='text-gray-500 hover:text-gray-900 dark:hover:text-white'
						>
							<svg
								width='24'
								height='25'
								viewBox='0 0 24 25'
								fill='none'
								xmlns='http://www.w3.org/2000/svg'
							>
								<path
									fillRule='evenodd'
									clipRule='evenodd'
									d='M21.796 8.50275C21.7015 7.78887 21.4274 7.11025 20.9991 6.52973C20.4683 5.99795 19.7486 5.6952 18.9953 5.68688C16.2006 5.48596 12 5.48596 12 5.48596C12 5.48596 7.80143 5.48596 5.00273 5.68688C4.24968 5.69503 3.53015 5.99783 2.9999 6.52973C2.56975 7.10969 2.29516 7.78904 2.202 8.50376C2.07717 9.573 2.00974 10.6481 2 11.7245V13.2314C2.00968 14.3078 2.07711 15.3829 2.202 16.4521C2.29694 17.1675 2.56903 17.8482 2.99384 18.4332C3.60357 18.9714 4.38752 19.2738 5.20271 19.285C6.80154 19.4367 12.001 19.486 12.001 19.486C12.001 19.486 16.2036 19.486 18.9983 19.285C19.752 19.2763 20.472 18.9732 21.0031 18.4412C21.4304 17.8599 21.7038 17.1811 21.798 16.4672C21.9228 15.3979 21.9903 14.3228 22 13.2464V11.7235C21.9886 10.6471 21.9205 9.57204 21.796 8.50275ZM9.98707 15.0869V9.44104L15.4411 12.273L9.98707 15.0869Z'
									fill='#6B7280'
								/>
							</svg>
						</a>
						<a
							href='https://github.com/rnadigital/agentcloud'
							target='_blank'
							rel='noopener noreferrer'
							className='text-gray-500 hover:text-gray-900 dark:hover:text-white'
						>
							<svg
								width='24'
								height='25'
								viewBox='0 0 24 25'
								fill='none'
								xmlns='http://www.w3.org/2000/svg'
							>
								<path
									fillRule='evenodd'
									clipRule='evenodd'
									d='M12.0061 2.48597C9.63078 2.48334 7.3322 3.34847 5.52229 4.92633C3.71237 6.50419 2.50942 8.69163 2.12903 11.0966C1.74863 13.5016 2.21566 15.967 3.4464 18.0509C4.67715 20.1347 6.59116 21.7009 8.84543 22.4687C9.34968 22.5639 9.52919 22.2463 9.52919 21.9753C9.52919 21.7301 9.51911 20.9232 9.51507 20.0667C6.73463 20.6874 6.1487 18.8574 6.1487 18.8574C5.96519 18.2374 5.57175 17.7051 5.03935 17.3564C4.13169 16.7202 5.10893 16.7357 5.10893 16.7357C5.42582 16.7805 5.72855 16.8989 5.99404 17.082C6.25952 17.265 6.48075 17.5078 6.64084 17.7919C6.77627 18.0448 6.95922 18.2676 7.17911 18.4475C7.39901 18.6274 7.6515 18.7608 7.92197 18.8399C8.19244 18.9191 8.47552 18.9425 8.75486 18.9087C9.03419 18.875 9.30423 18.7847 9.54936 18.6433C9.59395 18.1232 9.81905 17.6368 10.1837 17.2726C7.96501 17.014 5.63033 16.1347 5.63033 12.2037C5.61654 11.1851 5.98563 10.2001 6.66101 9.45309C6.35487 8.56912 6.38913 7.59863 6.75682 6.73969C6.75682 6.73969 7.59589 6.46452 9.506 7.7907C11.144 7.33141 12.8722 7.33141 14.5102 7.7907C16.4162 6.46452 17.2503 6.73969 17.2503 6.73969C17.6195 7.59798 17.6556 8.56845 17.3511 9.45309C18.0262 10.2001 18.3946 11.1852 18.3798 12.2037C18.3798 16.1419 16.0411 17.0078 13.8163 17.2612C14.0545 17.5097 14.2383 17.8075 14.3553 18.1347C14.4724 18.4619 14.52 18.8109 14.495 19.1584C14.495 20.5301 14.4829 21.6349 14.4829 21.9722C14.4829 22.2442 14.6635 22.5639 15.1697 22.4636C17.4205 21.6928 19.3306 20.1259 20.5582 18.043C21.7859 15.9601 22.2511 13.4972 21.8707 11.0947C21.4902 8.69221 20.2889 6.50693 18.4816 4.92973C16.6743 3.35253 14.3789 2.48629 12.0061 2.48597Z'
									fill='#6B7280'
								/>
							</svg>
						</a>
					</div>
				</footer>
			</div>
		</>
	);
});
