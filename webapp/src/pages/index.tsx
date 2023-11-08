import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
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

	return null; //TODO: a "homepage"?

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
