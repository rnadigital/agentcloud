import * as API from '@api';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import Permission from '@permission';
import ErrorAlert from 'components/ErrorAlert';
import PermissionsEditor from 'components/PermissionsEditor';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { TEAM_BITS } from 'permissions/bits';
import React, { useEffect, useState } from 'react';

export default function EditTeamMember(props) {
	const [accountContext]: any = useAccountContext();
	const { account } = accountContext as any;
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

	return (
		<>
			<Head>
				<title>Edit Team Member</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<div className='border-b dark:border-slate-400 pb-2 my-2'>
				<h3 className='pl-2 text-sm font-medium text-gray-500 dark:text-white align-middle'>
					<span
						onClick={() => router.push(`/${resourceSlug}/team`)}
						className='cursor-pointer text-gray-600 hover:text-blue-600'
					>
						Team
					</span>
					<ChevronRightIcon className='inline-block w-4 h-4 mx-1 mb-1' />
					Edit Team Member
				</h3>
			</div>

			<PermissionsEditor
				editingPermission={new Permission(teamMember?.permissions)}
				filterBits={TEAM_BITS}
				memberName={teamMember?.name}
				memberEmail={teamMember?.email}
				initialRole={teamMember?.role}
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
