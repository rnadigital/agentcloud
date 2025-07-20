import * as API from '@api';
import { HomeIcon, PlusIcon } from '@heroicons/react/20/solid';
import AgentList from 'components/AgentList';
import NewButtonSection from 'components/NewButtonSection';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function Agents(props) {
	const router = useRouter();
	const [accountContext]: any = useAccountContext();
	const { teamName, account, csrf } = accountContext as any;
	const { resourceSlug } = router.query;

	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { agents } = state;
	const filteredAgents = agents?.filter(x => !x.hidden);

	function fetchAgents() {
		API.getAgents({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchAgents();
	}, [resourceSlug]);

	if (agents == null) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`Agents - ${teamName}`}</title>
			</Head>

			<PageTitleWithNewButton
				searchQuery=''
				setSearchQuery={() => {}}
				list={filteredAgents}
				title='Agents'
				buttonText='New Agent'
				href='/agent/add'
			/>

			{agents.length === 0 && (
				<NewButtonSection
					setOpen={() => {}}
					link={`/${resourceSlug}/agent/add`}
					emptyMessage={'No agents'}
					icon={
						<svg
							className='mx-auto h-12 w-12 text-gray-400'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
							aria-hidden='true'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								fill='none'
								viewBox='0 0 24 24'
								strokeWidth={1.5}
								stroke='currentColor'
								className='w-6 h-6'>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z'
								/>
							</svg>
						</svg>
					}
					message={'Get started by creating a new agent.'}
					buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
					buttonMessage={'New Agent'}
				/>
			)}
			<AgentList agents={filteredAgents} fetchAgents={fetchAgents} />
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
