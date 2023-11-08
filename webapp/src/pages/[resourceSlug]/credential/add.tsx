import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import CredentialForm from '../../../components/CredentialForm';
import { useAccountContext } from '../../../context/account';

export default function AddCredential(props) {

	const [accountContext]: any = useAccountContext();
	const { teamName } = accountContext as any;

	return (<>

		<Head>
			<title>New Credential - {teamName}</title>
		</Head>

		<CredentialForm />

	</>);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
