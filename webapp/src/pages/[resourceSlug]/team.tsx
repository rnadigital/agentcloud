import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { TrashIcon } from '@heroicons/react/20/solid';
import * as API from '@api';
import { toast } from 'react-toastify';
import { useAccountContext } from '../../context/account';
import { useRouter } from 'next/router';
import InviteForm from 'components/InviteForm';

const MemberCard = ({ member, callback }) => {

	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;

	async function deleteMember(e) {
		e.preventDefault();
		await API.deleteFromTeam({resourceSlug, _csrf: csrf, memberId: member._id}, () => {
			toast.success(`Team member ${member.name} removed`);
			callback && callback();
		}, (res) => {
			toast.error(res);
		}, null);
	}

	return (
		<div className='p-4 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md'>
			<p className='mb-2 font-bold tracking-tight text-gray-900'>{member.name}</p>
			<p className='mb-3 font-normal text-sm text-gray-700'>{member.email}</p>
			<div className='flex space-x-4 space-between w-full relative'>
				<span className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${member.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`}>
					{member.emailVerified ? 'Active' : 'Pending'}
				</span>
				{!member.teamOwner && <button type='button' onClick={deleteMember}
					className='rounded-full bg-indigo-600 p-1 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 absolute right-0'
					// className='rounded-full relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-red-600'
				>
					<TrashIcon className='h-5 w-5' aria-hidden='true' />
				</button>}
			</div>
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
		{team && team.length > 0 && <div className='flex flex-wrap gap-4 my-4'>
			{team[0].members.map(member => (
				<MemberCard key={member._id} member={member} callback={fetchTeam} />
			))}
		</div>}

		<div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Invite Members:</h3>
		</div>

		<InviteForm callback={fetchTeam} />

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
