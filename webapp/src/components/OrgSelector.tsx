import * as API from '@api';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import CreateTeamModal from 'components/CreateTeamModal';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const TEAM_PARENT_LOCATIONS = ['agent', 'task', 'tool', 'datasource', 'model'];

function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

export default function OrgSelector({ orgs }) {
	const [accountContext, refreshAccountContext, setSwitchingContext]: any = useAccountContext();
	const { account, csrf, teamName: _teamName } = accountContext as any;
	const [teamName, setTeamName] = useState('Loading...');
	const router = useRouter();
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;
	const team = account?.teams;
	useEffect(() => {
		const matchingOrg = account?.orgs?.find(o => o.teams.some(t => t.id === resourceSlug));
		const team = matchingOrg?.teams?.find(t => t.id === resourceSlug);
		setTeamName(team?.name || _teamName);
	}, [router?.query?.resourceSlug, account?.currentTeam, _teamName]);
	const [modalOpen, setModalOpen]: any = useState(false);

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
							router.push(redirect);
						},
						600 + (Date.now() - start)
					);
				},
				() => {
					toast.error('An error occurred when switching teams');
				},
				router
			);
		} catch (e) {
			console.error(e);
		}
	}

	async function callback(newTeamId, newOrgId) {
		await refreshAccountContext();
		switchTeam(newOrgId, newTeamId);
		setModalOpen(false);
	}

	return (
		<>
			<Menu as='div' className='relative inline-block text-left w-full'>
				<div>
					<Menu.Button className='text-white justify-between inline-flex w-full max-w-[75%] gap-x-1.5 rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-600'>
						<span className='whitespace-nowrap truncate'>{teamName || ''}</span>
						<ChevronDownIcon className='-mr-1 h-5 w-5 text-gray-400 bs-auto' aria-hidden='true' />
					</Menu.Button>
				</div>

				<Transition
					as={Fragment}
					enter='transition ease-out duration-100'
					enterFrom='transform opacity-0 scale-95'
					enterTo='transform opacity-100 scale-100'
					leave='transition ease-in duration-75'
					leaveFrom='transform opacity-100 scale-100'
					leaveTo='transform opacity-0 scale-95'
				>
					<Menu.Items className='absolute left-0 z-10 mt-2 w-56 origin-top-left divide-y divide-gray-700 rounded-md bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
						<div className='py-1'>
							{orgs
								.filter(o => o?.teams?.length > 0)
								.map((org, oi) => (
									<span key={`org_${oi}`}>
										{oi > 0 && <hr className='border-t border-slate-700 w-full' />}
										<Menu.Item disabled>
											{({ active }) => (
												<a
													href='#'
													className={classNames(
														active ? 'bg-gray-100' : 'text-gray-100',
														'group flex items-center px-4 py-2 text-sm group-hover:text-gray-700 font-semibold cursor-default break-keep'
													)}
												>
													{org.name}
												</a>
											)}
										</Menu.Item>
										{org.teams.map((team, ti) => (
											<Menu.Item key={`org_${oi}_team_${ti}`}>
												{({ active }) => (
													<a
														onClick={() => switchTeam(org.id, team.id)}
														href='#'
														className={classNames(
															active ? '' : 'text-gray-100',
															resourceSlug === team.id ? 'bg-indigo-900' : '',
															'group flex items-center px-6 py-2 text-sm group-hover:text-gray-700 hover:bg-slate-700 hover:text-white break-keep'
														)}
													>
														{team.name}
													</a>
												)}
											</Menu.Item>
										))}
									</span>
								))}
							<hr className='border-t border-2 border-slate-700 w-full' />
							<a
								onClick={() => {
									setModalOpen('team');
								}}
								href='#'
								className='text-gray-100 group flex items-center px-3 py-2 text-sm group-hover:text-gray-700 hover:bg-slate-700 hover:text-white'
							>
								+ New Team
							</a>
						</div>
					</Menu.Items>
				</Transition>
			</Menu>
			<CreateTeamModal open={modalOpen === 'team'} setOpen={setModalOpen} callback={callback} />
		</>
	);
}
