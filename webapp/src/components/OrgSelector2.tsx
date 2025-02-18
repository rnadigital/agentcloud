import * as API from '@api';
import { useAccountContext } from 'context/account';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from 'modules/components/ui/dropdown-menu';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FaChevronDown } from 'react-icons/fa'; // React icon for dropdown
import cn from 'utils/cn';

const TEAM_PARENT_LOCATIONS = ['agent', 'task', 'tool', 'datasource', 'model'];

export default function OrgSelector2({ orgs }) {
	const [accountContext, refreshAccountContext, setSwitchingContext]: any = useAccountContext();
	const { account, csrf, teamName: _teamName } = accountContext as any;
	const [teamName, setTeamName] = useState('Loading...');
	const [isOpen, setIsOpen] = useState(false); // Track if the dropdown is open
	const router = useRouter();
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;

	useEffect(() => {
		const matchingOrg = account?.orgs?.find(o => o.teams.some(t => t.id === resourceSlug));
		const team = matchingOrg?.teams?.find(t => t.id === resourceSlug);
		setTeamName(team?.name || _teamName);
	}, [router?.query?.resourceSlug, account?.currentTeam, _teamName]);

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

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger
				className='flex items-center m-auto justify-between overflow-hidden h-10 px-4 py-2 border border-gray-300 rounded-lg shadow-md bg-white hover:bg-indigo-50 transition duration-200 ease-in-out focus:outline-none w-full'
				onClick={() => setIsOpen(prevState => !prevState)} // Toggle dropdown visibility on click
			>
				<p className='text-left text-gray-700 text-sm font-semibold truncate max-w-[150px]'>
					{teamName}
				</p>
				<FaChevronDown className='text-gray-600 ml-2 text-xs transition-transform duration-300 ease-in-out' />
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className='p-2 bg-white rounded-lg shadow-lg border border-gray-200 mt-2 overflow-y-auto max-h-[300px] transition-all duration-200 ease-in-out'
				style={{
					pointerEvents: isOpen ? 'auto' : 'none',
					zIndex: isOpen ? 10 : -1
				}}
			>
				{orgs
					.filter(o => o?.teams?.length > 0)
					.map((org, oi) => (
						<Fragment key={`org_${oi}`}>
							<DropdownMenuLabel className='text-gray-800 font-bold text-center'>
								{org.name}
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								{org.teams.map((team, ti) => (
									<DropdownMenuItem
										className={cn(
											'cursor-pointer px-4 py-2 rounded-md text-gray-700 hover:bg-indigo-100 transition-all duration-200',
											resourceSlug === team.id ? 'bg-indigo-200' : ''
										)}
										key={`org_${oi}_team_${ti}`}
										onClick={() => switchTeam(org.id, team.id)}
									>
										{team.name}
									</DropdownMenuItem>
								))}
							</DropdownMenuGroup>
						</Fragment>
					))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
