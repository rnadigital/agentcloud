import * as API from '@api';
import Permission from '@permission';
import ErrorAlert from 'components/ErrorAlert';
import PermissionsEditor from 'components/PermissionsEditor';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ORG_BITS } from 'permissions/bits';
import React, { useEffect, useState } from 'react';

export default function EditOrgMember(props) {
	const [accountContext]: any = useAccountContext();
	const { account } = accountContext as any;
	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { resourceSlug, memberId } = router.query;
	const { orgMember } = state;

	async function fetchOrgMember() {
		API.getOrgMember({ resourceSlug, memberId }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchOrgMember();
	}, [resourceSlug]);

	if (!account) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>Edit Org Member</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<div className='border-b dark:border-slate-400 pb-2 my-2'>
				<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>Edit Org Member</h3>
			</div>

			<PermissionsEditor
				memberName={orgMember?.name}
				memberEmail={orgMember?.email}
				initialRole={orgMember?.role}
				editingPermission={new Permission(orgMember?.permissions)}
				filterBits={ORG_BITS}
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
