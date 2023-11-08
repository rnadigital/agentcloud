import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import * as API from '../../api';
import { useAccountContext } from '../../context/account';
import CredentialCards from '../../components/CredentialCards';
import { useRouter } from 'next/router';

export default function Credentials(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { credentials } = state;
	const resourceSlug = account?.currentTeam;

	function fetchCredentials() {
		API.getCredentials({ resourceSlug: resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchCredentials();
	}, []);

	if (!credentials) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>Credentials - {teamName}</title>
		</Head>

		{credentials.length > 0 && <div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Credentials</h3>
		</div>}
	
		<CredentialCards credentials={credentials} fetchCredentials={fetchCredentials} />

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
