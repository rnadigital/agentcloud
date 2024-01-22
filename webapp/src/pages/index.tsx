import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

import { useAccountContext } from '../context/account';

export default function Index() {

	const [accountContext]: any = useAccountContext();
	const { account } = accountContext as any;

	const router = useRouter();

	if (!account) {
		router.push('/login');
	} else {
		router.push('/account');
	}

	return null;

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
