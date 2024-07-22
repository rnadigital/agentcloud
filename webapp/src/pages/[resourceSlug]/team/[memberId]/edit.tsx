import * as API from '@api';
import Permission from '@permission';
import ErrorAlert from 'components/ErrorAlert';
import PermissionsEditor from 'components/PermissionsEditor';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { TEAM_BITS } from 'permissions/bits';
import Permissions from 'permissions/permissions';
import Roles from 'permissions/roles';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function EditTeamMember(props) {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { account, team, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { resourceSlug, memberId } = router.query;
	const { teamMember } = state;

	async function fetchTeamMember() {
		API.getTeamMember({ resourceSlug, memberId }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchTeamMember();
	}, [resourceSlug]);

	if (!account) {
		return <Spinner />;
	}

	const { stripeCustomerId, stripeEndsAt, stripeCancelled } = account?.stripe || {};

	return (
		<>
			<Head>
				<title>Edit Team Member</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<div className='border-b dark:border-slate-400 pb-2 my-2'>
				<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>Edit Team Member</h3>
			</div>

			<PermissionsEditor
				editingPermission={new Permission(teamMember?.permissions)}
				filterBits={TEAM_BITS}
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
