import * as API from '@api';
import { PlusIcon } from '@heroicons/react/20/solid';
import CreateDatasourceForm from 'components/CreateDatasourceForm';
import CreateDatasourceModal from 'components/CreateDatasourceModal';
import DatasourceFileTable from 'components/DatasourceFileTable';
import DatasourceTable from 'components/DatasourceTable';
import ErrorAlert from 'components/ErrorAlert';
import NewButtonSection from 'components/NewButtonSection';
import PageTitleWithNewButton from 'components/PageTitleWithNewButton';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { useSocketContext } from 'context/socket';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function Datasources(props) {

	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const [, notificationTrigger]: any = useSocketContext();
	const { account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState(null);
	const { datasources, models } = state;
	const [open, setOpen] = useState(false);

	async function fetchDatasources() {
		await API.getDatasources({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchDatasources();
		refreshAccountContext();
	}, [resourceSlug, notificationTrigger]);

	if (!datasources) {
		return <Spinner />;
	}

	return (<>

		<Head>
			<title>{`Datasources - ${teamName}`}</title>
		</Head>

		<PageTitleWithNewButton list={datasources} title='File Uploads' />

		<span className='pt-1 mb-3 w-full'>
			<CreateDatasourceForm models={models} fetchDatasourceFormData={fetchDatasources} hideTabs={true} initialStep={1} fetchDatasources={fetchDatasources} />
		</span>

		<DatasourceFileTable datasources={datasources.filter(d => d?.sourceType === 'file')} fetchDatasources={fetchDatasources} />

		<span className='py-8 h-1'></span>

		<PageTitleWithNewButton list={datasources} title='Data Connections' buttonText='New Connection' onClick={() => setOpen(true)} />

		<CreateDatasourceModal
			open={open}
			setOpen={setOpen}
			callback={() => {
				setOpen(false);
				fetchDatasources();
			}}
		/>

		<DatasourceTable datasources={datasources.filter(d => d?.sourceType !== 'file')} fetchDatasources={fetchDatasources} />

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
