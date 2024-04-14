import { PlusIcon } from '@heroicons/react/20/solid';
import CredentialTable from 'components/CredentialTable';
import NewButtonSection from 'components/NewButtonSection';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import * as API from '../../api';

export default function Credentials(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { credentials } = state;
	function fetchCredentials() {
		API.getCredentials({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchCredentials();
	}, [resourceSlug]);

	if (!credentials) {
		return <Spinner />;
	}

	return (<>

		<Head>
			<title>{`Credentials - ${teamName}`}</title>
		</Head>

		<PageTitleWithNewButton list={credentials} title='Credentials' buttonText='New Credential' href='/credential/add' />

		<CredentialTable credentials={credentials} fetchCredentials={fetchCredentials} />

		{credentials.length === 0 && <NewButtonSection
			link={`/${resourceSlug}/credential/add`}
			emptyMessage={'No credentials'}
			icon={<svg
				className='mx-auto h-12 w-12 text-gray-400'
				fill='none'
				viewBox='0 0 24 24'
				stroke='currentColor'
				aria-hidden='true'
			>
				<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-6 h-6'>
					<path strokeLinecap='round' strokeLinejoin='round' d='M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z' />
				</svg>
			</svg>}
			message={'Get started by adding credentials.'}
			buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
			buttonMessage={'Add Credential'}
		/>}

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
