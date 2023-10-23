import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
	ChevronDownIcon,
	HomeIcon,
} from '@heroicons/react/20/solid';
import * as API from '../api';
import { useRouter } from 'next/router';

function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

export default function OrgSelector({ orgs }) {

	const router = useRouter();
	const [_state, dispatch] = useState();
	const [_error, setError] = useState();

	async function switchTeam(orgId, teamId) {
		console.log('switchTeam', orgId, teamId);
		await API.switchTeam({
			orgId,
			teamId,
		}, dispatch, setError, router);
	}

	//TODO: switch to usecontext so a global user and org/team context can be set, and switch route after page change

	return (
		<Menu as='div' className='relative inline-block text-left'>
			<div>
				<Menu.Button className='inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50'>
          			Teams
					<ChevronDownIcon className='-mr-1 h-5 w-5 text-gray-400' aria-hidden='true' />
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
				<Menu.Items className='absolute left-0 z-10 mt-2 w-56 origin-top-left divide-y divide-gray-700 rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
					{/*<div className='py-1'>
						
					</div>*/}
					<div className='py-1'>
						{orgs.map((org, oi) => (<>
							{oi > 0 && <hr />}
							<Menu.Item disabled key={`org_${oi}`}>
								{({ active }) => (
									<a
										href='#'
										className={classNames(
											active ? 'bg-gray-100' : 'text-gray-100',
											'group flex items-center px-4 py-2 text-sm group-hover:text-gray-700'
										)}
									>
										{org.name} ({org.id})
									</a>
								)}
							</Menu.Item>
							{org.teams.map((team, ti) => (
								<Menu.Item onClick={() => switchTeam(org.id, team.id)} key={`org_${oi}_team_${ti}`}>
									{({ active }) => (
										<a
											href='#'
											className={classNames(
												active ? 'bg-gray-100' : 'text-gray-100',
												'group flex items-center px-6 py-2 text-sm group-hover:text-gray-700'
											)}
										>
											{team.name} ({team.id})
										</a>
									)}
								</Menu.Item>
							))}
						</>))}
					</div>
				</Menu.Items>
			</Transition>
		</Menu>
	);
}
