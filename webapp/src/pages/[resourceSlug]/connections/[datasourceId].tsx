import { useAccountContext } from 'context/account';
import useResponsive from 'hooks/useResponsive';
import { ConnectionsIdCards } from 'modules/components/connections/ConnectionsIdCards';
import { ConnectionsIdTabs } from 'modules/components/connections/ConnectionsIdTabs';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useConnectionsStore } from 'store/connections';
import { useShallow } from 'zustand/react/shallow';

export default function ConnectionsItem({ datasource }) {
	const { isMobile } = useResponsive();

	const connectionsStore = useConnectionsStore(
		useShallow(state => ({
			setStore: state.setStore,
			fetchSchema: state.fetchSchema,
			fetchDatasource: state.fetchDatasource,
			fetchJobsList: state.fetchJobsList,
			name: state.datasource?.name
		}))
	);

	const { setStore, fetchSchema, fetchDatasource, fetchJobsList, name } = connectionsStore;
	const router = useRouter();
	const { resourceSlug, datasourceId } = router.query;
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;

	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setStore({
			resourceSlug: resourceSlug as string,
			datasourceId: datasourceId as string,
			csrf
		});
	}, [resourceSlug, datasourceId, csrf]);

	useEffect(() => {
		setTimeout(() => {
			fetchSchema(router);
		}, 1500);
	}, []);

	useEffect(() => {
		fetchDatasource(router);
		fetchJobsList(router);
	}, [resourceSlug]);

	useEffect(() => {
		if (datasource) {
			setStore({
				datasource
			});
		}
	}, [datasource]);
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	return (
		<div className='text-foreground'>
			<section className='flex gap-2 mb-4'>
				<h4 className='text-gray-500 font-semibold'>Connections</h4>
				<span className='text-gray-500'>&gt;</span>
				<h4 className='text-gray-500 font-semibold'>{name}</h4>
			</section>
			{isMobile ? <ConnectionsIdCards /> : <ConnectionsIdTabs />}
			{/* <ConnectionsIdCards /> */}
		</div>
	);
}

export async function getServerSideProps({
	req,
	res,
	query,
	resolvedUrl,
	locale,
	locales,
	defaultLocale
}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
