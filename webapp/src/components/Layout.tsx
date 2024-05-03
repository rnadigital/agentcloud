import { Dialog, Menu, Transition } from '@headlessui/react';
import {
	ChevronDownIcon,
} from '@heroicons/react/20/solid';
import {
	ArrowRightOnRectangleIcon,
	Bars3Icon,
	BellIcon,
	ChatBubbleLeftIcon,
	CircleStackIcon,
	CpuChipIcon,
	CreditCardIcon,
	KeyIcon,
	PencilSquareIcon,
	PuzzlePieceIcon,
	Square3Stack3DIcon,
	UserGroupIcon,
	UserIcon,
	WrenchScrewdriverIcon,
	XMarkIcon,
} from '@heroicons/react/24/outline';
import AgentAvatar from 'components/AgentAvatar';
import classNames from 'components/ClassNames';
// import DebugLogs from 'components/DebugLogs';
import NotificationBell from 'components/NotificationBell';
import OrgSelector from 'components/OrgSelector';
import PreviewSessionList from 'components/PreviewSessionList';
import { SessionStatus } from 'components/SessionCards';
import Head from 'next/head';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { withRouter } from 'next/router';
import { useRouter } from 'next/router';
import { Fragment, useState } from 'react';

import packageJson from '../../package.json';

const noNavPages = [
	'/login',
	'/register',
	'/changepassword',
	'/requestchangepassword',
	'/verify',
	'/redirect',
];

const agentNavigation: any[] = [
	// { name: 'Home', href: '/home', icon: HomeIcon },
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
		icon: <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<path d='M22.125 11.85C21.7125 11.5875 21.225 11.7375 20.9625 12.1125L16.9875 18.4125C16.9125 18.4875 16.8375 18.6 16.8 18.7125C16.725 18.825 16.6875 18.9375 16.6875 19.05L15.375 22.5L18 19.8375C18.075 19.7625 18.15 19.6875 18.225 19.6125C18.3 19.5375 18.375 19.425 18.4125 19.3125L22.3875 13.0125C22.6125 12.6 22.5 12.075 22.125 11.85Z' fill='currentColor'/>
			<path d='M13.35 19.05C12.15 19.35 10.9125 19.5375 9.75 19.5375C7.0125 19.5375 4.425 18.525 3.1875 17.9625C3.3375 15.9 4.0125 14.025 5.175 12.6375C6.375 11.2125 8.025 10.425 9.75 10.425C11.475 10.425 13.125 11.2125 14.325 12.6375C14.9625 13.3875 15.45 14.2875 15.7875 15.3C15.9375 15.75 16.425 15.975 16.8375 15.825C17.2875 15.675 17.5125 15.1875 17.3625 14.775C16.95 13.5375 16.35 12.45 15.6 11.55C14.625 10.3875 13.3875 9.56255 12.0375 9.11255C13.3875 8.32505 14.2875 6.86255 14.2875 5.21255C14.2875 2.70005 12.2625 0.675049 9.75 0.675049C7.2375 0.675049 5.2125 2.70005 5.2125 5.21255C5.2125 6.86255 6.1125 8.32505 7.4625 9.11255C6.1125 9.56255 4.9125 10.3875 3.9 11.55C2.4 13.3125 1.575 15.7875 1.5 18.4501C1.5 18.7875 1.6875 19.0875 1.95 19.2375C2.8875 19.6875 6.1875 21.225 9.75 21.225C11.0625 21.225 12.4125 21.0375 13.7625 20.7001C14.2125 20.5875 14.475 20.1375 14.3625 19.6875C14.25 19.2 13.8 18.9375 13.35 19.05ZM9.75 2.36255C11.325 2.36255 12.6 3.63755 12.6 5.21255C12.6 6.78755 11.325 8.06255 9.75 8.06255C8.175 8.06255 6.9 6.78755 6.9 5.21255C6.9 3.63755 8.175 2.36255 9.75 2.36255Z' fill='currentColor'/>
		</svg>
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
		name: 'Credentials',
		href: '/credentials',
		base: '/credential',
		icon: <KeyIcon className='h-6 w-6 shrink-0' aria-hidden='true' />
	},
	// { name: 'Vector Collections', href: '/collections', icon: <Square3Stack3DIcon className='h-6 w-6 shrink-0' aria-hidden='true' /> },
];

const teamNavigation = [
	{ name: 'Team Members', href: '/team', base: '/team', icon: <UserGroupIcon className='h-6 w-6 shrink-0' aria-hidden='true' /> },
];

const userNavigation = [
	{ name: 'My Account', href: '/account' },
	{ name: 'Billing', href: '/billing' },
	{ name: 'Sign out', href: '#', logout: true },
];

import * as API from '../api';
import { useAccountContext } from '../context/account';
import { useChatContext } from '../context/chat';

export default withRouter(function Layout(props) {

	const [chatContext]: any = useChatContext();
	const [accountContext]: any = useAccountContext();
	const { account, csrf, switching } = accountContext as any;
	const { children } = props as any;
	const router = useRouter();
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;
	const showNavs = !noNavPages.includes(router.pathname);
	const path = usePathname();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const orgs = account?.orgs || [];

	if (!account) {
		// return 'Loading...'; //TODO: loader?
	}

	return (
		<>
			<Head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width initial-scale=1' />
				<link rel='shortcut icon' href='/images/favicon.ico' />
			</Head>
			<div className='flex flex-col flex-1 bg-white dark:bg-slate-900'>
				<Transition.Root show={sidebarOpen} as={Fragment}>
					<Dialog
						as='div'
						className='relative z-50 lg:hidden'
						onClose={setSidebarOpen}
					>
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
												<XMarkIcon
													className='h-6 w-6 text-white'
													aria-hidden='true'
												/>
											</button>
										</div>
									</Transition.Child>
									{/* Sidebar component, swap this element with another sidebar if you like */}
									{showNavs && <div className='flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 ring-1 ring-white/10'>
										<div className='flex mt-4 h-16 shrink-0 items-center'>
											<img
												src='/images/agentcloud-full-white-bg-trans.png'
												alt='Your Company'
												width={200}
												height={150}
											/>
										</div>
										{resourceSlug && <nav className='flex flex-1 flex-col'>
											<div className='text-xs font-semibold leading-6 text-indigo-200'>Teams</div>
											<ul role='list' className='flex flex-1 flex-col gap-y-7'>
												<li key='orgselector'>
													<ul role='list' className='-mx-2 mt-2 space-y-1'>
														<OrgSelector orgs={orgs} />
													</ul>
												</li>
												<li key='agentnavigation'>
													{agentNavigation.length > 0 && <div className='text-xs font-semibold leading-6 text-indigo-200'>e</div>}
													<ul role='list' className='-mx-2 space-y-1'>
														{agentNavigation.map((item) => {
															return (<li key={item.name} className='ps-4'>
																<Link
																	suppressHydrationWarning
																	href={`/${resourceSlug}${item.href}`}
																	className={classNames(
																		(path.endsWith(item.href) || path.startsWith(`/${resourceSlug}${item.base}`))
																			? 'bg-gray-800 text-white'
																			: 'text-gray-400 hover:text-white hover:bg-gray-800',
																		'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
																	)}
																>
																	{item.icon}
																	{item.name}
																</Link>
															</li>);
														})}
													</ul>
												</li>
												{teamNavigation.length > 0 && <div className='text-xs font-semibold leading-6 text-indigo-200'></div>}
												<li className='mt-auto'>
													<ul role='list' className='-mx-2 mt-2 space-y-1'>
														{teamNavigation.map((item) => (
															<li key={item.name}>
																<Link
																	key={`link_${item.name}`}
																	suppressHydrationWarning
																	href={`/${resourceSlug}${item.href}`}
																	className={classNames(
																		(path.endsWith(item.href) || path.startsWith(`/${resourceSlug}${item.base}`))
																			? 'bg-gray-800 text-white'
																			: 'text-gray-400 hover:text-white hover:bg-gray-800',
																		'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
																	)}
																>
																	{item.icon}
																	{item.name}
																</Link>
															</li>
														))}
														<li key='account'>
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
														</li>
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
															<form action='/forms/account/logout' method='POST'>
																<input type='hidden' name='_csrf' value={csrf} />
																<button
																	className='w-full group flex flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white'
																	type='submit'>
																	<ArrowRightOnRectangleIcon
																		className='h-6 w-6 shrink-0'
																		aria-hidden='true'
																	/>
																	Log out
																</button>
															</form>
														</li>
													</ul>
												</li>
											</ul>
										</nav>}
									</div>}
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</Dialog>
				</Transition.Root>

				{/* Static sidebar for desktop */}
				{showNavs && <div className='hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col'>
					{/* Sidebar component, swap this element with another sidebar if you like */}
					<div className='flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 dark:border-r dark:border-slate-600'>
						<div className='bg-gray-900 h-24 fixed z-50 w-[280px] left-0'>
							<img
								className='mx-auto'
								src='/images/agentcloud-full-white-bg-trans.png'
								alt='Your Company'
								width={200}
								height={150}
							/>
						</div>
						{resourceSlug && <nav className='flex flex-1 flex-col mt-24'>
							<div className='text-xs font-semibold leading-6 text-indigo-200'>Teams</div>
							<ul role='list' className='flex flex-1 flex-col gap-y-7'>
								<li>
									<ul role='list' className='-mx-2 mt-2 space-y-1'>
										<OrgSelector orgs={orgs} />
									</ul>
								</li>
								<li>
									{agentNavigation.length > 0 && <div className='text-xs font-semibold leading-6 text-indigo-200'>Platform</div>}
									<ul role='list' className='-mx-2 space-y-1'>
										{agentNavigation.map((item) => {
											return (
												<li key={item.name}>
													<Link
														suppressHydrationWarning
														href={`/${resourceSlug}${item.href}`}
														className={classNames(
															(path.endsWith(item.href) || path.startsWith(`/${resourceSlug}${item.base}`))
																? 'bg-gray-800 text-white'
																: 'text-gray-400 hover:text-white hover:bg-gray-800',
															'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
														)}
													>
														{item.icon}
														{item.name}
													</Link>
												</li>
											);
										})}
										<PreviewSessionList />
									</ul>
								</li>
								<li className='absolute bottom-0 left-0 bg-gray-900 p-4 ps-6 w-full'>
									
									{teamNavigation.length > 0 && <div className='text-xs font-semibold leading-6 text-indigo-200'>Admin</div>}
									<ul role='list' className='-mx-2 mt-2 space-y-1'>
										{teamNavigation.map((item) => (
											<li key={item.name}>
												<Link
													suppressHydrationWarning
													href={`/${resourceSlug}${item.href}`}
													className={classNames(
														(path.endsWith(item.href) || path.startsWith(`/${resourceSlug}${item.base}`))
															? 'bg-gray-800 text-white'
															: 'text-gray-400 hover:text-white hover:bg-gray-800',
														'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
													)}
												>
													{item.icon}
													{item.name}
												</Link>
											</li>
										))}
										<li>
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
										</li>
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
												<CreditCardIcon
													className='h-6 w-6 shrink-0'
													aria-hidden='true'
												/>
												Billing
											</Link>
										</li>
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
											<form className='w-full' action='/forms/account/logout' method='POST'>
												<input type='hidden' name='_csrf' value={csrf} />
												<button
													className='w-full group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white'
													type='submit'>
													<ArrowRightOnRectangleIcon
														className='h-6 w-6 shrink-0'
														aria-hidden='true'
													/>
													Log out
												</button>
											</form>
										</li>
									</ul>
								</li>
							</ul>
						</nav>}
					</div>
				</div>}

				<div className={classNames(showNavs ? 'lg:pl-72' : '', 'flex flex-col flex-1')}>
					{showNavs && <div className='sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8'>
						<button
							type='button'
							className='-m-2.5 p-2.5 text-gray-700 lg:hidden'
							onClick={() => setSidebarOpen(true)}
						>
							<span className='sr-only'>Open sidebar</span>
							<Bars3Icon className='h-6 w-6' aria-hidden='true' />
						</button>

						{/* Separator */}
						<div
							className='h-6 w-px bg-gray-900/10 lg:hidden'
							aria-hidden='true'
						/>

						<h5 className='text-xl text-ellipsis overflow-hidden whitespace-nowrap'>
							{chatContext?.prompt && chatContext.prompt}
						</h5>

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
								{chatContext?.tokens != null && <span
									className='me-2 whitespace-nowrap cursor-pointer h-6 capitalize inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-200 dark:ring-slate-600 dark:bg-slate-800 dark:text-white'
								>
									<CreditCardIcon className='h-5 w-5' />
									Tokens used: {chatContext?.tokens||0}
								</span>}
								{chatContext?.status && chatContext?.type && <span
									className='whitespace-nowrap cursor-pointer h-6 capitalize inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-200 dark:ring-slate-600 dark:bg-slate-800 dark:text-white'
									onClick={chatContext.scrollToBottom}
								>
									<svg className={`h-1.5 w-1.5 ${SessionStatus[chatContext.status]}`} viewBox='0 0 6 6' aria-hidden='true'>
										<circle cx={3} cy={3} r={3} />
									</svg>
									{chatContext.type && chatContext.type.replace('_', ' ')}: {chatContext.status}
								</span>}
							</div>
							<div className='flex items-center gap-x-4 lg:gap-x-6'>
								{/* Notification Bell */}
								<NotificationBell />

								{/* debug logs
								<DebugLogs />*/}
								
								{/* Separator */}
								<div
									className='hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10'
									aria-hidden='true'
								/>

								{/* Profile dropdown */}
								{account && <Menu as='div' className='relative'>
									<Menu.Button className='-m-1.5 flex items-center'>
										<span className='sr-only'>Open user menu</span>
										{/*<ResolvedImage
											className='h-8 w-8 rounded-full bg-gray-50'
											src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
											alt=''
											width={64}
											height={64}
										/>*/}
										<AgentAvatar agent={{ name: account.email, icon: { /* TODO */ } }} />
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
											{account && <div className='px-4 py-3' key='accountdetails'>
												<p className='text-sm'>Signed in as</p>
												<p className='truncate text-sm font-semibold text-gray-900 dark:text-white'>{account.email}</p>
											</div>}
											{userNavigation.map((item) => (
												<Menu.Item key={item.name}>
													{({ active }) => {
														if (item.logout) {
															return <form className='w-full' action='/forms/account/logout' method='POST'>
																<input type='hidden' name='_csrf' value={csrf} />
																<button
																	className={classNames(
																		active ? 'bg-gray-50 dark:bg-slate-700' : '',
																		'w-full text-left block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-white',
																	)}
																	type='submit'>
																	Log out
																</button>
															</form>;
														}
														return <a
															href={item.href}
															className={classNames(
																active ? 'bg-gray-50 dark:bg-slate-700' : '',
																'block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-white',
															)}
														>
															{item.name}
														</a>;
													}}
												</Menu.Item>
											))}
										</Menu.Items>
									</Transition>
								</Menu>}
							</div>
						</div>
						
					</div>}
					<main className='py-10 flex flex-col flex-1'>
						<div className='px-4 sm:px-6 lg:px-8 flex flex-col flex-1'>

							{children}

						</div>
					</main>
				</div>
			</div>
			<div className={`transition-all duration-300 bg-white z-40 fixed w-screen h-screen overflow-hidden opacity-1 pointer-events-none ${switching===false?'opacity-0':''}`} />
			<div className={`transition-all duration-300 bg-gray-900 z-50 fixed w-[280px] h-screen overflow-hidden opacity-1 pointer-events-none ${switching===false?'opacity-0':''}`} />
			<footer className={`${showNavs ? 'lg:pl-72' : ''} mt-auto text-center text-gray-700 text-xs bg-white dark:bg-slate-900 dark:text-slate-400`}>
				<div className='py-3'>© {new Date().getFullYear()} RNA Digital - v{packageJson.version}-{process.env.NEXT_PUBLIC_SHORT_COMMIT_HASH}</div>
			</footer>
		</>
	);
});
