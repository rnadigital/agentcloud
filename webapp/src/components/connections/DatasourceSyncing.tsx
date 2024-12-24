import * as API from '@api';
import dataSyncAnimation from 'animations/dataSyncLoaderAnimation.json';
import { useOnboardingFormContext } from 'context/onboardingform';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router'; // Ensure this import is present
import { useEffect } from 'react'; // Ensure these imports are present
import { useDatasourceStore } from 'store/datasource';
import { DatasourceStatus } from 'struct/datasource';

const Lottie = dynamic(() => import('lottie-react'), {
	ssr: false
});

const DatasourceSyncing = () => {
	const router = useRouter();
	const { resourceSlug } = router.query;

	const stagedDatasource = useDatasourceStore(state => state.stagedDatasource);

	const datasourceId = stagedDatasource?.datasourceId;

	useEffect(() => {
		fetchDatasource(); // Call fetchDatasource on component mount
	}, []); // Added dependency array

	async function fetchDatasource() {
		if (datasourceId) {
			await API.getDatasource(
				{
					resourceSlug,
					datasourceId
				},
				res => {
					const datasource = res?.datasource;
					if (datasource?.status === DatasourceStatus.READY) {
						router.push(`/${resourceSlug}/connections`);
					}
				},
				() => {},
				router
			);
		}
	}

	useEffect(() => {
		const interval = setInterval(() => {
			fetchDatasource();
		}, 10000);
		return () => {
			clearInterval(interval);
		};
	}, [resourceSlug]);

	return (
		<div className='w-full h-full grid place-items-center'>
			<Lottie animationData={dataSyncAnimation} loop={true} />
		</div>
	);
};

export default DatasourceSyncing;
