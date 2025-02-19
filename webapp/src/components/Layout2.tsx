import * as API from '@api';
import { Menu, Switch, Transition } from '@headlessui/react';
import {
	BuildingOfficeIcon,
	ChevronDownIcon,
	CircleStackIcon,
	CpuChipIcon,
	CubeIcon,
	PencilSquareIcon,
	PuzzlePieceIcon,
	ServerStackIcon,
	UserGroupIcon,
	WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import NotificationBell from 'components/NotificationBell';
import { useAccountContext } from 'context/account';
import { useChatContext } from 'context/chat';
import { useDeveloperContext } from 'context/developer';
import { ThemeContext } from 'context/themecontext';
import { Box, Building, LogOut, UsersRound } from 'lucide-react';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarProvider,
	SidebarTrigger
} from 'modules/components/ui/sidebar';
import { Toaster } from 'modules/components/ui/toaster';
import Head from 'next/head';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { withRouter } from 'next/router';
import { useRouter } from 'next/router';
import Permissions from 'permissions/permissions';
import { usePostHog } from 'posthog-js/react';
import { Fragment, useContext, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Progress } from 'modules/components/ui/progress';
import cn from 'utils/cn';
import { format } from 'date-fns';

import AgentAvatar from './AgentAvatar';
import OrgSelector from './OrgSelector';
import OrgSelector2 from './OrgSelector2';
import TrialNag from './TrialNag';

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
				xmlns='http://www.w3.org/2000/svg'>
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

// const teamNavigation = [
// 	{
// 		name: 'Organization',
// 		href: '/org',
// 		base: '/org',
// 		icon: <BuildingOfficeIcon className='h-6 w-6 shrink-0' aria-hidden='true' />,
// 		permissions: [Permissions.ORG_OWNER, Permissions.ORG_ADMIN, Permissions.EDIT_ORG]
// 	},
// 	{
// 		name: 'Team',
// 		href: '/team',
// 		base: '/team',
// 		icon: <UserGroupIcon className='h-6 w-6 shrink-0' aria-hidden='true' />,
// 		permissions: [
// 			Permissions.TEAM_OWNER,
// 			Permissions.TEAM_ADMIN,
// 			Permissions.EDIT_TEAM,
// 			Permissions.EDIT_TEAM_MEMBER,
// 			Permissions.ADD_TEAM_MEMBER,
// 			Permissions.REMOVE_TEAM_MEMBER
// 		]
// 	}
// ];

const userNavigation = [
	//{ name: 'My Account', href: '/account' },
	{ name: 'Billing', href: '/billing' },
	{ name: 'Theme', href: '#', theme: true },
	{ name: 'Developer Mode', href: '#', developer: true },
	{ name: 'Sign out', href: '#', logout: true }
];

const linkPaths = [
	{
		id: 1,
		name: 'Connections',
		path: '/connections',
		imgPath: '/sidebar/connections.png'
	},
	{
		id: 2,
		name: 'Apps',
		path: '/apps',
		imgPath: '/sidebar/apps.png'
	},
	{
		id: 3,
		name: 'Agents',
		path: '/agents',
		imgPath: '/sidebar/agents.png'
	},
	{
		id: 4,
		name: 'Tools',
		path: '/tools',
		imgPath: '/sidebar/tools.png'
	},
	{
		id: 5,
		name: 'Variables',
		path: '/variables',
		imgPath: '/sidebar/variables.png'
	},
	{
		id: 6,
		name: 'Models',
		path: '/models',
		imgPath: '/sidebar/models.png'
	},
	{
		id: 7,
		name: 'Vector DBs',
		path: '/vectordbs',
		imgPath: '/',
		icon: <ServerStackIcon className='h-4 w-4 shrink-0' aria-hidden='true' />
	},
	{
		id: 8,
		name: 'API Keys',
		path: '/apikeys',
		imgPath: '/sidebar/api.png',
		noResourceSlug: true
	},
	{
		id: 9,
		name: 'Session History',
		path: '/sessions',
		imgPath: '/sidebar/session-history.png'
	}
];

const teamNavigation = [
	{
		id: 1,
		name: 'Organization',
		href: '/org',
		icon: <Building width={15} />
	},
	{
		id: 2,
		name: 'Team',
		href: '/team',
		icon: <UsersRound width={15} />
	}
];

export { linkPaths };

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
	const showNavs = account && !noNavPages.some(p => path?.includes(p));
	const { toggleTheme, toggleUseSystemTheme } = useContext(ThemeContext);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const orgs = account?.orgs || [];
	const scrollRef = useRef(null);

	const calculateUntilDate = dateCreated => {
		if (typeof window === 'undefined') return 'N/A'; // Return N/A on server-side
		try {
			if (!dateCreated) return 'N/A';
			const date = new Date(dateCreated);
			const futureDate = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate());
			return format(futureDate, 'MMM dd, yyyy');
		} catch (error) {
			console.error('Error formatting date:', error);
			return 'N/A';
		}
	};

	//this is temporary, will be removed once other pages are updated
	const isRegisteringPage = path && isFullPages.some(p => path.includes(p));
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

	if (isRegisteringPage) {
		return (
			<>
				<Head>
					<meta charSet='utf-8' />
					<meta name='viewport' content='width=device-width initial-scale=1' />
					<link rel='shortcut icon' href='/images/favicon.ico' />
				</Head>
				<main className='flex flex-col flex-1'>
					<div className='flex flex-col flex-1'>{children}</div>
				</main>
			</>
		);
	}

	return (
		<>
			<Head>
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width initial-scale=1' />
				<link rel='shortcut icon' href='/images/favicon.ico' />
			</Head>
			<SidebarProvider defaultOpen={true}>
				<Sidebar>
					<SidebarHeader className='p-4 flex flex-col justify-center shadow-lg'>
						<div className='flex gap-2 items-center'>
							<Box />
							<p className='font-medium'>Agent Cloud</p>
						</div>
					</SidebarHeader>
					<SidebarContent className='p-4'>
						<div className='my-4 px-2'>
							<p className='text-lg font-semibold text-white mb-2'>Team</p>
							<OrgSelector2 orgs={orgs} />
						</div>

						<div className='sidebar-nav-wrapper'>
							<ul className='list-none p-0 flex flex-col'>
								{linkPaths.map(link => {
									return (
										<li key={link.name} className='p-2.5 flex gap-2 items-center'>
											<Link
												className='flex items-center gap-2'
												href={link.noResourceSlug ? link.path : `/${resourceSlug}${link.path}`}>
												{link.icon ? link.icon : <img width={15} src={link.imgPath} />}
												<p
													className={cn(
														'cursor-pointer hover:text-gray-300',
														path?.endsWith(link.path) ? 'text-gray-100' : 'text-gray-300'
													)}>
													{link.name}
												</p>
											</Link>
										</li>
									);
								})}
							</ul>
							<div className='my-4 border-t border-gray-300 w-full'></div>
							<ul className='list-none p-0 flex flex-col'>
								{teamNavigation.map(item => (
									<Link
										key={item.id}
										href={`/${resourceSlug}${item.href}`}
										className='p-2.5 flex gap-2 items-center'>
										{item.icon}
										<p
											className={cn(
												'cursor-pointer hover:text-gray-300',
												path?.endsWith(item.href) ? 'text-gray-100' : 'text-gray-300'
											)}>
											{item.name}
										</p>
									</Link>
								))}
								<button
									className='p-2.5 flex gap-2 items-center text-gray-300 hover:text-gray-100'
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
									}}>
									<LogOut width={15} />
									<p>Logout</p>
								</button>
								{/* <Link className='p-2.5 flex gap-2 items-center'>
									<UsersRound width={15} />
									<p>Team</p>
								</Link> */}

								{/* {teamNavigation.map(item => (
									<li key={item.name}>
										<Link suppressHydrationWarning href={`/${resourceSlug}${item.href}`}>
											{item.icon}
											{item.name}
										</Link>
									</li>
								))} */}
								{/* <Link className='p-2.5 flex gap-2 items-center'>
									<Building width={15} />
									<p>Organization</p>
								</Link>
								<Link className='p-2.5 flex gap-2 items-center'>
									<LogOut width={15} />
									<p>Logout</p>
								</Link> */}
							</ul>
						</div>
					</SidebarContent>
					<SidebarFooter>
						<TrialNag />
					</SidebarFooter>
				</Sidebar>
				<div className='grow w-full'>
					<section className='min-h-14 border-b sticky top-0 bg-background flex gap-4 items-center justify-between p-4 z-50'>
						<SidebarTrigger />
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
												aria-hidden='true'>
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
										leaveTo='transform opacity-0 scale-95'>
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
																	className={cn(
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
																	}}>
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
																			className='group relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-0 active:bg-transparent'>
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
																		onClick={() => toggleTheme('light')}>
																		Light
																	</button>
																	<button
																		className='w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white'
																		onClick={() => toggleTheme('dark')}>
																		Dark
																	</button>
																	<button
																		className='w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white'
																		onClick={() => toggleUseSystemTheme()}>
																		System
																	</button>

																	<hr className='border-gray-200 dark:border-slate-700 mt-2 ' />
																</div>
															);
														}
														return (
															<a
																href={item.href}
																className={cn(
																	active ? 'bg-gray-50 dark:bg-slate-700' : '',
																	'block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-white'
																)}>
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
					</section>
					<section className='px-8 py-4'>
						{children}
						<Toaster />
					</section>
				</div>
			</SidebarProvider>
		</>
	);
});
