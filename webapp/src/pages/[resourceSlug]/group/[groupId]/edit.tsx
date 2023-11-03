import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import * as API from '../../../../api';
import GroupForm from '../../../../components/GroupForm';
import { useRouter } from 'next/router';
import { useAccountContext } from '../../../../context/account';
import { PhotoIcon, UserCircleIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';

export default function EditGroup(props) {

	const [accountContext]: any = useAccountContext();
	const { teamName, account, csrf } = accountContext as any;
	const resourceSlug = account.currentTeam;

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [agents, setAgents] = useState(null); //TODO: take from prop
	const [error, setError] = useState();
	const { groupData } = state;
	console.log('agents', agents);
	useEffect(() => {
		if (!groupData || !agents) {
			API.getGroup({
				resourceSlug: account.currentTeam,
				groupId: router.query.groupId,
			}, dispatch, setError, router);
			API.getAgents({
				resourceSlug: account.currentTeam,
			}, setAgents, setError, router);
		}
	}, []);

	if (groupData == null || agents == null) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>Edit Group - {teamName}</title>
		</Head>

		<div>
			<a
				className='mb-4 inline-flex align-center rounded-md bg-indigo-600 pe-3 ps-2 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
				href={`/${resourceSlug}/groups`}
			>
				<ChevronLeftIcon className='w-5 me-1' />
				<span>Back</span>
			</a>
		</div>

		<div className='border-b pb-2 my-2 mb-6'>
			<h3 className='font-semibold text-gray-900'>Edit Group</h3>
		</div>

		<GroupForm editing={true} group={groupData} agentChoices={agents.agents} />

	</>);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data }));
}
