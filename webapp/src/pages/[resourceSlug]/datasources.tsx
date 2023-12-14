import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import * as API from '../../api';
import { useAccountContext } from 'context/account';
import DatasourceCards from 'components/DatasourceCards';
import NewButtonSection from 'components/NewButtonSection';
import { PlusIcon } from '@heroicons/react/20/solid';
import { useRouter } from 'next/router';

export default function Datasources(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { datasources } = state;

	async function fetchDatasources() {
		await API.getDatasources({ resourceSlug }, dispatch, setError, router);
	}

	//TODO: move to add page
	const [connectorList, setConnectorList] = useState([]);
	useEffect(() => {
		fetch('https://connectors.airbyte.com/files/generated_reports/connector_registry_report.json')
			.then(res => res.json())
			.then(json => setConnectorList(json));
	}, []);
	console.log('connectorList', connectorList);

	useEffect(() => {
		fetchDatasources();
	}, [resourceSlug]);

	if (!datasources) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Datasources - ${teamName}`}</title>
		</Head>

		<div className='border-b pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Datasources</h3>
		</div>      

		<DatasourceCards datasources={datasources} fetchDatasources={fetchDatasources} />

		{datasources.length === 0
			? <NewButtonSection
				link={`/${resourceSlug}/datasource/add`}
				emptyMessage={'No datasources'}
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
				message={'Get started by adding a datasource.'}
				buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
				buttonMessage={'Add Datasource'}
			/>
			: <Link href={`/${resourceSlug}/datasource/add`} className='mt-4'>
				<button
					type='button'
					className='inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
				>
					<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />
					Add Datasource
				</button>
			</Link>
		}

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
