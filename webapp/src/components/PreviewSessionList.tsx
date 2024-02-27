import * as API from '@api';
import ButtonSpinner from 'components/ButtonSpinner';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import ContentLoader from 'react-content-loader';

export default function PreviewSessionList(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { sessions } = state;

	async function fetchSessions() {
		await API.getSessions({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchSessions();
	}, [resourceSlug, router.asPath]);

	if (!resourceSlug) {
		return null;
	}

	if (!sessions) {
		return new Array(5).fill(0).map((x, xi) => (<div key={`contentLoader_${xi}`} className='ps-4 py-2 flex items-center justify-center'>
			<ContentLoader 
				speed={2}
				width={'100%'}
				height={10}
				viewBox='0 0 100% 10'
				backgroundColor='rgb(136, 143, 155)'
				foregroundColor='#5a5a5a'
			>
				<rect x='0' y='0' rx='5' width='100%' height='7' />
			</ContentLoader>
		</div>));
	}

	return sessions.slice(0, 5).map(s => (<li key={s._id} className='ps-4'>
		<Link
			suppressHydrationWarning
			href={`/${resourceSlug}/session/${s._id}`}
			className='text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
		>
			<p className='overflow-hidden truncate text-ellipsis'>{s.prompt}</p>
		</Link>
	</li>));

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
