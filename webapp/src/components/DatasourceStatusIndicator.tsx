import ButtonSpinner from 'components/ButtonSpinner';
import ProgressBar from 'components/ProgressBar';
import { DatasourceStatus, datasourceStatusColors } from 'struct/datasource';

function DatasourceStatusIndicator({ datasource }) {
	const { total, success, failure, lastUpdated } = datasource?.recordCount || {};
	const lastUpdatedAgo = lastUpdated ? Date.now() - lastUpdated : null;
	const successPercentage = (total != null ? (success / total) * 100 : 0) || 0;
	const finished =
		((success || 0) + (failure || 0) >= total || lastUpdatedAgo > 30000) && total > 0;
	return (
		<span className='tooltip z-100'>
			{total > 0 && (
				<span className='tooltiptext text-sm capitalize !w-[150px] !-ml-[75px] whitespace-pre'>
					{total &&
						`${(success || 0) + (failure || 0)}/${total} (${successPercentage.toFixed(1)}%)\nsuccess: ${success || 0}\nfailure: ${failure || 0}`}
				</span>
			)}
			{DatasourceStatus.EMBEDDING === datasource.status && !finished ? (
				<ProgressBar total={total} success={success} failure={failure} />
			) : (
				<div
					className={`max-w-[300px] px-3 py-[2px] text-sm text-white text-center rounded-full capitalize ${datasource?.status === DatasourceStatus.READY ? datasourceStatusColors[datasource.status] : 'barberpole'}`}
				>
					{datasource.status || 'Unknown'}
				</div>
			)}
		</span>
	);
}

export default DatasourceStatusIndicator;
