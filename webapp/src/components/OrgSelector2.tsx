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
import cn from 'utils/cn';

const TEAM_PARENT_LOCATIONS = ['agent', 'task', 'tool', 'datasource', 'model'];

export default function OrgSelector2({ orgs }) {
	const [accountContext, refreshAccountContext, setSwitchingContext]: any = useAccountContext();
	const { account, csrf, teamName: _teamName } = accountContext as any;
	const [teamName, setTeamName] = useState('Loading...');
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
		<DropdownMenu>
			<DropdownMenuTrigger className='outline-none p-2 my-2 border border-gray-300 rounded w-full'>
				<p>{teamName}</p>
			</DropdownMenuTrigger>
			<DropdownMenuContent className='w-[--radix-dropdown-menu-trigger-width]'>
				{orgs
					.filter(o => o?.teams?.length > 0)
					.map((org, oi) => (
						<Fragment key={`org_${oi}`}>
							<DropdownMenuLabel>{org.name}</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								{org.teams.map((team, ti) => (
									<DropdownMenuItem
										className={cn(
											'cursor-pointer',
											resourceSlug === team.id ? 'bg-indigo-100' : ''
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
