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
import Router from 'next/router';
import Link from 'next/link';
import { Fragment, useState, useEffect } from 'react';
import classNames from './ClassNames';

import { Dialog, Menu, Transition } from '@headlessui/react';
import {
	Bars3Icon,
	BellIcon,
	UserIcon,
	Cog6ToothIcon,
	HomeIcon,
	Square3Stack3DIcon,
	XMarkIcon,
	ArrowRightOnRectangleIcon,
	CpuChipIcon,
	WrenchScrewdriverIcon,
	ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import {
	ChevronDownIcon,
	MagnifyingGlassIcon,
} from '@heroicons/react/20/solid';
import { SessionStatus } from './SessionCards';

import OrgSelector from './OrgSelector';

const noNavPages = [
	'/tos',
	'/login',
	'/register',
	'/changepassword',
	'/requestchangepassword',
	'/verify',
];

const teamNavigation = [
	// { name: 'Home', href: '/home', icon: HomeIcon },
	{ name: 'Sessions', href: '/sessions', icon: Square3Stack3DIcon },
	{ name: 'Agents', href: '/agents', icon: CpuChipIcon },
	// { name: 'Tools', href: '/tools', icon: WrenchScrewdriverIcon },
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

// const pages = [
//   { name: 'Projects', href: '#', current: false },
//   { name: 'Project Nero', href: '#', current: true },
// ];

export default withRouter(function Layout(props) {

	const [chatContext]: any = useChatContext();
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const { children, router } = props as any;
	const showNavs = !noNavPages.includes(router.pathname);
	const path = usePathname();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const resourceSlug = account?.currentTeam;
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

			<div className='flex flex-col flex-1'>
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
					<div className='flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4'>
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
					{showNavs && <div className='sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8'>
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
							{chatContext?.prompt && `"${chatContext.prompt}"`}
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
								{chatContext?.status && <span className='h-6 capitalize inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-200'>
									<svg className={`h-1.5 w-1.5 ${SessionStatus[chatContext.status]}`} viewBox='0 0 6 6' aria-hidden='true'>
										<circle cx={3} cy={3} r={3} />
									</svg>
									{chatContext.status}
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
									<Menu.Button className='-m-1.5 flex items-center p-1.5'>
										<span className='sr-only'>Open user menu</span>
										{/*<ResolvedImage
											className='h-8 w-8 rounded-full bg-gray-50'
											src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
											alt=''
											width={64}
											height={64}
										/>*/}
										<span className='hidden lg:flex lg:items-center'>
											<span
												className='text-sm font-semibold leading-6 text-gray-900'
												aria-hidden='true'
											>
												{account.name}
											</span>
											<ChevronDownIcon
												className='ml-2 h-5 w-5 text-gray-400'
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
										<Menu.Items className='absolute right-0 z-10 mt-2.5 w-64 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none'>
											{account && <div className='px-4 py-3'>
												<p className='text-sm'>Signed in as</p>
												<p className='truncate text-sm font-semibold text-gray-900'>{account.email}</p>
											</div>}
											{userNavigation.map((item) => (
												<Menu.Item key={item.name}>
													{({ active }) => {
														if (item.logout) {
															return <form className='w-full' action='/forms/account/logout' method='POST'>
																<input type='hidden' name='_csrf' value={csrf} />
																<button
																	className={classNames(
																		active ? 'bg-gray-50' : '',
																		'w-full text-left block px-3 py-1 text-sm leading-6 text-gray-900',
																	)}
																	type='submit'>
																	Log out
																</button>
															</form>;
														}
														return <a
															href={item.href}
															className={classNames(
																active ? 'bg-gray-50' : '',
																'block px-3 py-1 text-sm leading-6 text-gray-900',
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

			<footer className={`${showNavs ? 'lg:pl-72' : ''} mt-auto text-center text-gray-700 text-xs`}>
				<div className='py-3'>© 2023 RNA Digital</div>
			</footer>
		</>
	);
});
