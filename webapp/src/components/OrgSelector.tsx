import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
	ChevronDownIcon,
	HomeIcon,
} from '@heroicons/react/20/solid';
import * as API from '../api';
import { useRouter } from 'next/router';
import { useAccountContext } from '../context/account';

function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

export default function OrgSelector({ orgs }) {

	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;
	const teamName = orgs?.find(o => o.teams.find(t => t.id === resourceSlug))?.name;
	const [_state, dispatch] = useState();
	const [_error, setError] = useState();

	async function switchTeam(orgId, teamId) {
		const splitLocation = location.pathname.split('/').filter(n => n);
		const foundResourceSlug = account.orgs
			.find(o => o.teams.find(t => t.id.toString() === splitLocation[0]));
		let redirect = location.pathname;
		if (foundResourceSlug) {
			splitLocation.shift();
			if (splitLocation.length <= 1) {
				redirect = `/${teamId}/${splitLocation.join('/')}`;
			} else {
				redirect = `/${teamId}/${splitLocation[0]}s`;
			}
		}
		await API.switchTeam({
			orgId,
			teamId,
			_csrf: csrf,
			redirect,
		}, dispatch, setError, router);
		refreshAccountContext();
	}

	return (<>
		<Menu as='div' className='relative inline-block text-left w-full'>
			<div>
				<Menu.Button className='text-white justify-between inline-flex w-full max-w-[75%] gap-x-1.5 rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-600'>
          			<span>{teamName||''}</span>
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
					{/*<div className='py-1'>
						
					</div>*/}
					<div className='py-1'>
						{orgs.map((org, oi) => (<span key={`org_${oi}`}>
							{oi > 0 && <hr />}
							<Menu.Item disabled>
								{({ active }) => (
									<a
										href='#'
										className={classNames(
											active ? 'bg-gray-100' : 'text-gray-100',
											'group flex items-center px-4 py-2 text-sm group-hover:text-gray-700'
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
												resourceSlug === team.id ? 'bg-indigo-900': '',
												'group flex items-center px-6 py-2 text-sm group-hover:text-gray-700 hover:bg-slate-700 hover:text-white'
											)}
										>
											{team.name}
										</a>
									)}
								</Menu.Item>
							))}
						</span>))}
					</div>
				</Menu.Items>
			</Transition>
		</Menu>
	</>);
}
