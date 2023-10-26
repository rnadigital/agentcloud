import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import * as API from '../api';
import { useRouter } from 'next/router';
import { useAccountContext } from '../context/account';
import SessionCards from '../components/SessionCards';

const people = [];

export default function Home(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { integrations } = state;

	useEffect(() => {
		if (!integrations) {
			API.getIntegrations(dispatch, setError, router);
		}
	}, []);
	
	if (!integrations) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>Integrations</title>
		</Head>

		<div className='pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Intgrations</h3>
		</div>

		<div className='bg-white shadow sm:rounded-lg'>
	      <div className='px-4 py-5 sm:p-6'>
	        <h3 className='text-base font-semibold leading-6 text-gray-900'>Google Ads Platform</h3>
	        <div className='mt-2 max-w-xl text-sm text-gray-500'>
	          <p>
				Connect your Google Ads Platform account.
	          </p>
	        </div>
	        <div className='mt-5'>
	          <button
	            type='button'
	            className='inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500'
	          >
	            Conncet
	          </button>
	        </div>
	      </div>
	    </div>

	</>);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data }));
}
