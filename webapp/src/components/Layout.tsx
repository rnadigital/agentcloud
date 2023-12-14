import Head from 'next/head';
import Image from 'next/image';
// TODO: Remove once https://github.com/vercel/next.js/issues/52216 is resolved.
// `next/image` seems to be affected by a default + named export bundling bug.
let ResolvedImage: any = Image;
if ('default' in ResolvedImage) {
	ResolvedImage = ResolvedImage.default;
}
import { withRouter } from 'next/router';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Fragment, useState } from 'react';
import classNames from './ClassNames';
import Blockies from 'react-blockies';
import packageJson from '../../package.json';

import { Dialog, Menu, Transition } from '@headlessui/react';
import {
	Bars3Icon,
	UserIcon,
	ChatBubbleLeftIcon,
	XMarkIcon,
	ArrowRightOnRectangleIcon,
	CreditCardIcon,
	KeyIcon,
	WrenchScrewdriverIcon,
	CircleStackIcon,
} from '@heroicons/react/24/outline';
import {
	ChevronDownIcon,
} from '@heroicons/react/20/solid';
import { SessionStatus } from './SessionCards';

import OrgSelector from './OrgSelector';

const noNavPages = [
	'/login',
	'/register',
	'/changepassword',
	'/requestchangepassword',
	'/verify',
	'/redirect',
];

const teamNavigation = [
	// { name: 'Home', href: '/home', icon: HomeIcon },
	{ name: 'Sessions', href: '/sessions', icon: <ChatBubbleLeftIcon className='h-6 w-6 shrink-0' aria-hidden='true' /> },
	{ name: 'Agents', href: '/agents', icon: <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
		<path d='M22.125 11.85C21.7125 11.5875 21.225 11.7375 20.9625 12.1125L16.9875 18.4125C16.9125 18.4875 16.8375 18.6 16.8 18.7125C16.725 18.825 16.6875 18.9375 16.6875 19.05L15.375 22.5L18 19.8375C18.075 19.7625 18.15 19.6875 18.225 19.6125C18.3 19.5375 18.375 19.425 18.4125 19.3125L22.3875 13.0125C22.6125 12.6 22.5 12.075 22.125 11.85Z' fill='currentColor'/>
		<path d='M13.35 19.05C12.15 19.35 10.9125 19.5375 9.75 19.5375C7.0125 19.5375 4.425 18.525 3.1875 17.9625C3.3375 15.9 4.0125 14.025 5.175 12.6375C6.375 11.2125 8.025 10.425 9.75 10.425C11.475 10.425 13.125 11.2125 14.325 12.6375C14.9625 13.3875 15.45 14.2875 15.7875 15.3C15.9375 15.75 16.425 15.975 16.8375 15.825C17.2875 15.675 17.5125 15.1875 17.3625 14.775C16.95 13.5375 16.35 12.45 15.6 11.55C14.625 10.3875 13.3875 9.56255 12.0375 9.11255C13.3875 8.32505 14.2875 6.86255 14.2875 5.21255C14.2875 2.70005 12.2625 0.675049 9.75 0.675049C7.2375 0.675049 5.2125 2.70005 5.2125 5.21255C5.2125 6.86255 6.1125 8.32505 7.4625 9.11255C6.1125 9.56255 4.9125 10.3875 3.9 11.55C2.4 13.3125 1.575 15.7875 1.5 18.4501C1.5 18.7875 1.6875 19.0875 1.95 19.2375C2.8875 19.6875 6.1875 21.225 9.75 21.225C11.0625 21.225 12.4125 21.0375 13.7625 20.7001C14.2125 20.5875 14.475 20.1375 14.3625 19.6875C14.25 19.2 13.8 18.9375 13.35 19.05ZM9.75 2.36255C11.325 2.36255 12.6 3.63755 12.6 5.21255C12.6 6.78755 11.325 8.06255 9.75 8.06255C8.175 8.06255 6.9 6.78755 6.9 5.21255C6.9 3.63755 8.175 2.36255 9.75 2.36255Z' fill='currentColor'/>
	</svg> },
	{ name: 'Groups', href: '/groups', icon: <svg width='24' height='24' viewBox='0 0 24 24' fill='white' xmlns='http://www.w3.org/2000/svg'>
		<path d='M21.3 11.625C20.5125 10.6875 19.5375 10.0125 18.4875 9.59995C19.5375 8.88745 20.2125 7.68745 20.2125 6.29995C20.2125 4.08745 18.4125 2.32495 16.2375 2.32495C14.0625 2.32495 12.225 4.12495 12.225 6.33745C12.225 7.68745 12.9 8.92495 13.95 9.63745C12.9 10.05 11.925 10.725 11.1375 11.6625C11.1 11.7 11.1 11.7375 11.0625 11.7375C10.725 11.55 10.3875 11.4 10.05 11.25C11.1 10.5375 11.775 9.33745 11.775 7.94995C11.775 5.73745 9.97499 3.97495 7.79999 3.97495C5.62499 3.97495 3.82499 5.77495 3.82499 7.94995C3.82499 9.29995 4.49999 10.5375 5.54999 11.25C4.49999 11.6625 3.52499 12.3375 2.73749 13.275C1.46249 14.8125 0.712488 16.9125 0.674988 19.2C0.674988 19.5375 0.862488 19.8375 1.12499 19.95C1.91249 20.3625 4.72499 21.6375 7.79999 21.6375C11.1 21.6375 13.7625 20.325 14.5125 19.95C14.55 19.95 14.55 19.9125 14.5875 19.9125C15.15 19.9874 15.7125 20.025 16.2375 20.025C19.5 20.025 22.2 18.7125 22.9125 18.3375C23.175 18.1875 23.3625 17.8875 23.3625 17.5875C23.2875 15.3 22.575 13.1625 21.3 11.625ZM16.2 4.01245C17.475 4.01245 18.4875 5.06245 18.4875 6.29995C18.4875 7.53745 17.475 8.62495 16.2 8.62495C14.925 8.62495 13.9125 7.57495 13.9125 6.33745C13.9125 5.09995 14.925 4.01245 16.2 4.01245ZM7.79999 5.62495C9.07499 5.62495 10.0875 6.67495 10.0875 7.91245C10.0875 9.14995 9.03749 10.2 7.79999 10.2C6.56249 10.2 5.51249 9.14995 5.51249 7.91245C5.51249 6.67495 6.52499 5.62495 7.79999 5.62495ZM7.79999 19.9874C5.54999 19.9874 3.37499 19.1625 2.36249 18.7125C2.47499 17.025 3.07499 15.4875 4.01249 14.3625C5.02499 13.1625 6.37499 12.525 7.79999 12.525C9.26249 12.525 10.575 13.1625 11.5875 14.3625C12.525 15.4875 13.125 17.025 13.2375 18.7125C12.3 19.1625 10.2 19.9874 7.79999 19.9874ZM16.2 18.375C15.7875 18.375 15.3375 18.3375 14.85 18.2625C14.6625 16.35 13.95 14.5875 12.8625 13.275C12.7125 13.0875 12.5625 12.9375 12.375 12.75C12.375 12.75 12.375 12.75 12.4125 12.7125C13.425 11.5125 14.7375 10.875 16.2 10.875C17.6625 10.875 18.975 11.5125 19.9875 12.7125C20.925 13.8375 21.4875 15.375 21.6375 17.0625C20.625 17.55 18.6 18.375 16.2 18.375Z' fill='currentColor'/>
	</svg> },
	{ name: 'Credentials', href: '/credentials', icon: <KeyIcon className='h-6 w-6 shrink-0' aria-hidden='true' /> },
	{ name: 'Tools', href: '/tools', icon: <WrenchScrewdriverIcon className='h-6 w-6 shrink-0' aria-hidden='true' /> },
	{ name: 'Data Sources', href: '/datasources', icon: <CircleStackIcon className='h-6 w-6 shrink-0' aria-hidden='true' /> },
];

const libraryNavigation = [/*
	{ name: 'Trending', href: '/home', icon: ArrowTrendingUpIcon },
	{ name: 'Agents', href: '/home', icon: HomeIcon },
	{ name: 'Tools', href: '/home', icon: WrenchScrewdriverIcon },
*/];

const userNavigation = [
	{ name: 'My Account', href: '/account' },
	{ name: 'Sign out', href: '#', logout: true },
];

import { useAccountContext } from '../context/account';
import { useChatContext } from '../context/chat';
import * as API from '../api';

export default withRouter(function Layout(props) {

	const [chatContext]: any = useChatContext();
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const { children, router } = props as any;
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;
	const showNavs = !noNavPages.includes(router.pathname);
	const path = usePathname();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const orgs = account?.orgs || [];

	if (!account) {
		//from pages that aren't SSRd, account fetched async in context
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
										<div className='flex h-16 shrink-0 items-center'>
											<img
												src='/images/favicon.ico'
												alt='Your Company'
												width={48}
												height={48}
											/>
											<span className='ms-3 text-xl text-white'>
												Agent Cloud
											</span>
										</div>
										{resourceSlug && <nav className='flex flex-1 flex-col'>
											<ul role='list' className='flex flex-1 flex-col gap-y-7'>
												<li>
													<ul role='list' className='-mx-2 mt-2 space-y-1'>
														<OrgSelector orgs={orgs} />
													</ul>
												</li>
												<li>
													<ul role='list' className='-mx-2 space-y-1'>
														{teamNavigation.map((item) => (
															<li key={item.name}>
																<Link
																	suppressHydrationWarning
																	href={`/${resourceSlug}${item.href}`}
																	className={classNames(
																		path.endsWith(item.href)
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
													</ul>
												</li>
												<li>
													{libraryNavigation.length > 0 && <div className='text-xs font-semibold leading-6 text-indigo-200'>Library</div>}
													<ul role='list' className='-mx-2 space-y-1'>
														{libraryNavigation.map((item) => (
															<li key={item.name}>
																<Link
																	suppressHydrationWarning
																	href={`/library${item.href}`}
																	className={classNames(
																		path === `/library${item.href}`
																			? 'bg-gray-800 text-white'
																			: 'text-gray-400 hover:text-white hover:bg-gray-800',
																		'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
																	)}
																>
																	<item.icon
																		className='h-6 w-6 shrink-0'
																		aria-hidden='true'
																	/>
																	{item.name}
																</Link>
															</li>
														))}
													</ul>
												</li>
												<li className='mt-auto'>
													<ul role='list' className='-mx-2 mt-2 space-y-1'>
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
						<div className='flex h-16 shrink-0 items-center'>
							<img
								src='/images/favicon.ico'
								alt='Your Company'
								width={48}
								height={48}
							/>
							<span className='ms-3 text-xl text-white'>
								Agent Cloud
							</span>
						</div>
						{resourceSlug && <nav className='flex flex-1 flex-col'>
							<ul role='list' className='flex flex-1 flex-col gap-y-7'>
								<li>
									<ul role='list' className='-mx-2 mt-2 space-y-1'>
										<OrgSelector orgs={orgs} />
									</ul>
								</li>
								<li>
									<ul role='list' className='-mx-2 space-y-1'>
										{teamNavigation.map((item) => (
											<li key={item.name}>
												<Link
													suppressHydrationWarning
													href={`/${resourceSlug}${item.href}`}
													className={classNames(
														path.endsWith(item.href)
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
									</ul>
								</li>
								<li>
									{libraryNavigation.length > 0 && <div className='text-xs font-semibold leading-6 text-indigo-200'>Library</div>}
									<ul role='list' className='-mx-2 space-y-1'>
										{libraryNavigation.map((item) => (
											<li key={item.name}>
												<Link
													suppressHydrationWarning
													href={`/library${item.href}`}
													className={classNames(
														path === `/library${item.href}`
															? 'bg-gray-800 text-white'
															: 'text-gray-400 hover:text-white hover:bg-gray-800',
														'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
													)}
												>
													<item.icon
														className='h-6 w-6 shrink-0'
														aria-hidden='true'
													/>
													{item.name}
												</Link>
											</li>
										))}
									</ul>
								</li>
								<li className='mt-auto'>
									<ul role='list' className='-mx-2 mt-2 space-y-1'>
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
								{/*<button
									type='button'
									className='-m-2.5 p-2.5 text-gray-400 hover:text-gray-500'
								>
									<span className='sr-only'>View notifications</span>
									<BellIcon className='h-6 w-6' aria-hidden='true' />
								</button>*/}

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
										<Blockies className='rounded-full' seed={account.name} />
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
											{account && <div className='px-4 py-3'>
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

					{/*<nav className="flex border-b border-gray-200 bg-white" aria-label="Breadcrumb">
      <ol role="list" className="mx-auto flex w-full max-w-screen-xl space-x-4 px-4 sm:px-6 lg:px-8">
        <li className="flex">
          <div className="flex items-center">
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </a>
          </div>
        </li>
        {pages.map((page) => (
          <li key={page.name} className="flex">
            <div className="flex items-center">
              <svg
                className="h-full w-6 flex-shrink-0 text-gray-200"
                viewBox="0 0 24 44"
                preserveAspectRatio="none"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
              <a
                href={page.href}
                className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                aria-current={page.current ? 'page' : undefined}
              >
                {page.name}
              </a>
            </div>
          </li>
        ))}
      </ol>
    </nav>*/}

					<main className='py-10 flex flex-col flex-1'>
						<div className='px-4 sm:px-6 lg:px-8 flex flex-col flex-1'>

							{children}

						</div>
					</main>
				</div>
			</div>

			<footer className={`${showNavs ? 'lg:pl-72' : ''} mt-auto text-center text-gray-700 text-xs bg-white dark:bg-slate-900 dark:text-slate-400`}>
				<div className='py-3'>© 2023 RNA Digital - v{packageJson.version}-{process.env.NEXT_PUBLIC_SHORT_COMMIT_HASH}</div>
			</footer>
		</>
	);
});
