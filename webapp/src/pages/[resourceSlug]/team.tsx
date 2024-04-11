import * as API from '@api';
import { TrashIcon } from '@heroicons/react/20/solid';
import InviteForm from 'components/InviteForm';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import TeamMemberCard from 'components/TeamMemberCard';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Permissions from 'permissions/permissions';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function Team(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName, permissions } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { team, invites } = state;

	async function fetchTeam() {
		await API.getTeam({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchTeam();
	}, [resourceSlug]);

	if (!team) {
		return <Spinner />;
	}

	return (<>

		<Head>
			<title>{`Team Members - ${teamName}`}</title>
		</Head>

		<div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Team Members</h3>
		</div>

		{/* TODO: a section to show team members properly, and ability to remove from team if emailVerified: false  */}
		{team && team.length > 0 && <div className='flex flex-wrap gap-4 my-4'>
			{team[0].members.map(member => (
				<TeamMemberCard team={team} key={member._id} member={member} callback={fetchTeam} />
			))}
		</div>}

		{permissions.get(Permissions.ADD_TEAM_MEMBER) && <>
			<div className='border-b pb-2 my-2'>
				<h3 className='pl-2 font-semibold text-gray-900'>Invite Members:</h3>
			</div>
			<InviteForm callback={fetchTeam} />
		</>}

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
