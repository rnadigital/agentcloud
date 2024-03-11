import * as API from '@api';
import Permission from '@permission';
import ErrorAlert from 'components/ErrorAlert';
import PermissionsEditor from 'components/PermissionsEditor';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Permissions from 'permissions/permissions';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function EditTeamMember(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { resourceSlug } = router.query;

	async function fetchTeamMember() {
		API.getTeam({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchTeamMember();
	}, [resourceSlug]);
	
	if (!account) {
		return 'Loading...'; //TODO: loader
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

			<PermissionsEditor currentPermission={new Permission([Permissions.TESTING])} editingPermission={new Permission([Permissions.TESTING])} />

		</>
	);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
