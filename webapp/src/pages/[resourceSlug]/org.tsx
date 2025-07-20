import * as API from '@api';
import InviteFormModal from 'components/InviteFormModal';
import MemberList from 'components/MemberList';
import OrgSettingsForm from 'components/OrgSettingsForm';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Permissions from 'permissions/permissions';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import DeleteModal from '../../components/DeleteModal';

export default function Org(props) {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { orgName, permissions, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [modalOpen, setModalOpen]: any = useState(false);
	const [deletingMember, setDeletingMember] = useState(null);
	const { members, org } = state;

	async function fetchOrg() {
		await API.getOrg({ resourceSlug }, dispatch, setError, router);
	}

	async function refreshOrg() {
		fetchOrg();
		refreshAccountContext();
	}

	async function deleteOrgMember(memberId) {
		await API.deleteOrgMember(
			{
				_csrf: csrf,
				resourceSlug,
				memberId
			},
			() => {
				toast.success('Org member removed successfully');
				setModalOpen(false);
				fetchOrg();
			},
			err => {
				toast.error(err);
			},
			router
		);
	}

	async function deleteCallback(memberId) {
		setDeletingMember(memberId);
		setModalOpen(true);
	}

	useEffect(() => {
		fetchOrg();
	}, [resourceSlug]);

	if (!org) {
		return <Spinner />;
	}

	return (
		<>
			<DeleteModal
				open={modalOpen}
				confirmFunction={() => {
					deleteOrgMember(deletingMember);
					fetchOrg();
				}}
				cancelFunction={() => {
					setModalOpen(false);
				}}
				title={'Remove Org Member'}
				message={`Are you sure you want to remove this member from the org, including from all teams? This action cannot be undone.`}
			/>
			<Head>
				<title>{`Organization - ${orgName}`}</title>
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
				searchQuery=''
				setSearchQuery={() => {}}
				list={members}
				title='Org Members'
				buttonText='Invite Member'
				onClick={() => setModalOpen('member')}
				showButton={
					false /*TODO: INVITE TO ORG (select teams) permissions.get(Permissions.ADD_ORG_MEMBER)*/
				}
			/>

			<MemberList
				permissions={org?.permissions}
				members={members}
				fetchTeam={fetchOrg}
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
