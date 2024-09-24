import * as API from '@api';
import { TrashIcon } from '@heroicons/react/20/solid';
import InviteForm from 'components/InviteForm';
import Spinner from 'components/Spinner';
import TeamMemberCard from 'components/TeamMemberCard';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Permissions from 'permissions/permissions';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import InviteFormModal from '../../components/InviteFormModal';
import PageTitleWithNewButton from '../../components/PageTitleWithNewButton';
import TeamSettingsForm from '../../components/TeamSettingsForm';

export default function Team(props) {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { account, teamName, permissions } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [modalOpen, setModalOpen]: any = useState(false);
	const { team, invites } = state;

	async function fetchTeam() {
		await API.getTeam({ resourceSlug }, dispatch, setError, router);
	}

	async function refreshTeam() {
		fetchTeam();
		refreshAccountContext();
	}

	useEffect(() => {
		fetchTeam();
	}, [resourceSlug]);

	if (!team) {
		return <Spinner />;
	}

	let modal;
	switch (modalOpen) {
		case 'member':
			modal = (
				<InviteFormModal open={modalOpen !== false} setOpen={setModalOpen} callback={refreshTeam} />
			);
			break;
		default:
			modal = null;
			break;
	}

	return (
		<>
			{modal}
			<Head>
				<title>{`Team - ${teamName}`}</title>
			</Head>

			{permissions.get(Permissions.ADD_TEAM_MEMBER) && (
				<>
					<div className='border-b pb-2 my-2'>
						<h3 className='pl-2 font-semibold text-gray-900 dark:text-gray-50'>Settings</h3>
					</div>
					<TeamSettingsForm callback={refreshTeam} />
				</>
			)}

			<PageTitleWithNewButton
				list={team[0]?.members}
				title='Team Members'
				buttonText='Invite Member'
				onClick={() => setModalOpen('member')}
				showButton={permissions.get(Permissions.ADD_TEAM_MEMBER)}
			/>

			{/* TODO: a section to show team members properly, and ability to remove from team if emailVerified: false  */}
			{team && team.length > 0 && (
				<div className='flex flex-wrap gap-4 my-4'>
					{team[0].members.map(member => (
						<TeamMemberCard team={team} key={member._id} member={member} callback={fetchTeam} />
					))}
				</div>
			)}
		</>
	);
}

export async function getServerSideProps({
	req,
	res,
	query,
	resolvedUrl,
	locale,
	locales,
	defaultLocale
}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
