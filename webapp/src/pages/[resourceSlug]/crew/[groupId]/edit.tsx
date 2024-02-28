import * as API from '@api';
import { ChevronLeftIcon, PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid';
// import CrewForm from 'components/CrewForm';
// import { useAccountContext } from 'context/account';
// import Head from 'next/head';
// import Link from 'next/link';
// import { useRouter } from 'next/router';
// import React, { useEffect, useState } from 'react';
// 
// export default function EditCrew(props) {
// 
// 	const [accountContext]: any = useAccountContext();
// 	const { teamName, account, csrf } = accountContext as any;
// 	const router = useRouter();
// 	const { resourceSlug } = router.query;
// 	const [state, dispatch] = useState(props);
// 	const [agents, setAgents] = useState(null);
// 	const [error, setError] = useState();
// 	const { crewData } = state;
// 
// 	async function fetchAgents() {
// 		API.getCrew({
// 			resourceSlug,
// 			crewId: router.query.crewId,
// 		}, dispatch, setError, router);
// 		await API.getAgents({
// 			resourceSlug,
// 		}, setAgents, setError, router);
// 	}
// 	useEffect(() => {
// 		if (!crewData || !agents) {
// 			fetchAgents();
// 		}
// 	}, [resourceSlug]);
// 
// 	if (crewData == null || agents == null) {
// 		return 'Loading...'; //TODO: loader
// 	}
// 
// 	return (<>
// 
// 		<Head>
// 			<title>{`Edit Crew - ${teamName}`}</title>
// 		</Head>
// 
// 		<div>
// 			<a
// 				className='mb-4 inline-flex align-center rounded-md bg-indigo-600 pe-3 ps-2 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
// 				href={`/${resourceSlug}/crews`}
// 			>
// 				<ChevronLeftIcon className='w-5 me-1' />
// 				<span>Back</span>
// 			</a>
// 		</div>
// 
// 		<div className='border-b pb-2 my-2 mb-6'>
// 			<h3 className='font-semibold text-gray-900'>Edit Crew</h3>
// 		</div>
// 
// 		<CrewForm editing={true} crew={crewData} agentChoices={agents.agents} fetchAgents={fetchAgents} />
// 
// 	</>);
// }
// 
// export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
// 	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
// }
