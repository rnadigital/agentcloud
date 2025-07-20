import * as API from '@api';
import InviteFormModal from 'components/InviteFormModal';
import MemberList from 'components/MemberList';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import TeamSettingsForm from 'components/TeamSettingsForm';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Permissions from 'permissions/permissions';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function Team(props) {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { csrf, teamName, permissions } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [modalOpen, setModalOpen]: any = useState(false);
	const [searchQuery, setSearchQuery] = useState(''); // Search query state
	const { team, invites } = state;

	async function fetchTeam() {
		await API.getTeam({ resourceSlug }, dispatch, setError, router);
	}

	async function refreshTeam() {
		fetchTeam();
		refreshAccountContext();
		setModalOpen(false);
	}

	useEffect(() => {
		fetchTeam();
	}, [resourceSlug]);

	async function deleteCallback(memberId) {
		await API.deleteTeamMember(
			{
				_csrf: csrf,
				resourceSlug,
				memberId
			},
			() => {
				toast.success('Team member removed successfully');
				fetchTeam();
			},
			err => {
				toast.error(err);
			},
			router
		);
	}

	if (!team) {
		return <Spinner />;
	}

	// Filter members based on the search query
	const filteredMembers = team?.members?.filter(member =>
		member.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const memberCount = filteredMembers?.length || 0; // Count of members

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

			{permissions.get(Permissions.EDIT_TEAM) && (
				<>
					<TeamSettingsForm callback={refreshTeam} memberCount={memberCount} />
				</>
			)}

			<PageTitleWithNewButton
				list={team?.members}
				title='Team Members'
				buttonText='Invite Member'
				onClick={() => setModalOpen('member')}
				showButton={permissions.get(Permissions.ADD_TEAM_MEMBER)}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
			/>

			<MemberList
				permissions={team?.permissions}
				members={filteredMembers} // Pass the filtered list here
				fetchTeam={fetchTeam}
				deleteCallback={deleteCallback}
			/>
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
