import * as API from '@api';
import InviteFormModal from 'components/InviteFormModal';
import MemberList from 'components/MemberList';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import OrgSettingsForm from 'components/OrgSettingsForm';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Permissions from 'permissions/permissions';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function Org(props) {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { orgName, permissions } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [modalOpen, setModalOpen]: any = useState(false);
	const { members, org } = state;

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

	if (!org) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`Organisation - ${orgName}`}</title>
			</Head>

			{permissions.get(Permissions.EDIT_TEAM) && (
				<>
					<div className='border-b pb-2 my-2'>
						<h3 className='pl-2 font-semibold text-gray-900 dark:text-gray-50'>Settings</h3>
					</div>
					<OrgSettingsForm callback={refreshOrg} />
				</>
			)}

			<PageTitleWithNewButton
				list={members}
				title='Org Members'
				buttonText='Invite Member'
				onClick={() => setModalOpen('member')}
				showButton={permissions.get(Permissions.ADD_ORG_MEMBER)}
			/>

			<MemberList permissions={org?.permissions} members={members} fetchTeam={fetchOrg} deleteCallback={deleteCallback} />
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
