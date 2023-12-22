import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import * as API from '../../api';
import { useAccountContext } from '../../context/account';
import { useRouter } from 'next/router';
import InviteForm from 'components/InviteForm';

const MemberCard = ({ member }) => {
	return (
		<div className="p-4 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md">
			<p className="mb-2 font-bold tracking-tight text-gray-900">{member.name}</p>
			<p className="mb-3 font-normal text-sm text-gray-700">{member.email}</p>
			<span className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${member.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`}>
				{member.emailVerified ? 'Active' : 'Pending'}
			</span>
		</div>
	);
};

export default function Team(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { team, invites } = state;

	async function fetchTeam() {
		await API.getTeam({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchTeam();
	}, [resourceSlug]);

	if (!team) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Team Members - ${teamName}`}</title>
		</Head>

		<div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Team Members</h3>
		</div>

		{/* TODO: a section to show team members properly, and ability to remove from team if emailVerified: false  */}
		{team && team.length > 0 && <div className="flex flex-wrap gap-4 my-4">
			{team[0].members.map(member => (
				<MemberCard key={member._id} member={member} />
			))}
		</div>}

		<div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Invite Members:</h3>
		</div>

		<InviteForm />

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
