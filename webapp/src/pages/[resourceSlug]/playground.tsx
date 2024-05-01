import * as API from '@api';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import StartSessionForm from 'components/StartSessionForm';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Blockies from 'react-blockies';

export default function Playground(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { sessions, crews, agents } = state;
	const [open, setOpen] = useState(false);

	async function fetchSessions() {
		await API.getSessions({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchSessions();
	}, [resourceSlug]);

	if (!sessions) {
		return <Spinner />;
	}

	return (<>

		<Head>
			<title>{`Playground - ${teamName}`}</title>
		</Head>

		<span className='sm: w-full md:w-1/2 xl:w-1/3'>
			<p className='text-sm mb-1'>Run an App:</p>
			<StartSessionForm crews={crews} agents={agents} setOpen={setOpen} fetchSessions={fetchSessions} />
		</span>

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
