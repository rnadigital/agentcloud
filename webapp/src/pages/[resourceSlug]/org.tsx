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

export default function Org(props) {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { orgName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [modalOpen, setModalOpen]: any = useState(false);
	const { members, org } = state;

	console.log('members', members);
	console.log('org', org);

	async function fetchOrg() {
		await API.getOrg({ resourceSlug }, dispatch, setError, router);
	}

	async function refreshOrg() {
		fetchOrg();
		refreshAccountContext();
	}

	async function deleteCallback(memberId) {
		toast('TODO: delete org member');
	}

	useEffect(() => {
		fetchOrg();
	}, [resourceSlug]);

	// if (!org) {
	// 	return <Spinner />;
	// }

	return (
		<>
			<Head>
				<title>{`Organisation - ${orgName}`}</title>
			</Head>

			<PageTitleWithNewButton
				list={members}
				title='Org Members'
				buttonText='Invite Member'
				onClick={() => setModalOpen('member')}
				showButton={false} //TODO: show once we have "add org member" concept?
			/>

			<MemberList members={members} fetchTeam={fetchOrg} deleteCallback={deleteCallback} />
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
