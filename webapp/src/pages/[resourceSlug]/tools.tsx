import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import * as API from '../../api';
import { useAccountContext } from '../../context/account';
import { useRouter } from 'next/router';
import ToolForm from '../../components/ToolForm';

export default function Tools(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [open, setOpen] = useState(false);
	const resourceSlug = account?.currentTeam;

	function fetchTools() {
		API.getTools({ resourceSlug: resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchTools();
	}, [resourceSlug]);

	const { tools } = state;

	if (!tools) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>Tools - {teamName}</title>
		</Head>

		{tools.length > 0 && <div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Tools</h3>
		</div>}

		<ToolForm />

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
