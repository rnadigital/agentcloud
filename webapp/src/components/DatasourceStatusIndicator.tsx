import ButtonSpinner from 'components/ButtonSpinner';
import ProgressBar from 'components/ProgressBar';
import { DatasourceStatus, datasourceStatusColors } from 'struct/datasource';

function DatasourceStatusIndicator({ datasource, processingOrEmbedding, finished }: { datasource: any, processingOrEmbedding: boolean, finished?: boolean }) {
	const { total, success, failure } = datasource?.recordCount;
	const successPercentage = (total != null ? (success/total)*100 : 0) || 0;
	const failurePercentage = (total != null ? (failure/total)*100 : 0) || 0;
	return <span className='tooltip z-100'>
		{total > 0 &&<span className='tooltiptext capitalize !w-[150px] !-ml-[75px] whitespace-pre'>
			{`${(success||0)+(failure||0)}/${total} (${successPercentage.toFixed(1)}%)\nsuccess: ${success||0}\nfailure: ${failure||0}`}
		</span>}
		{DatasourceStatus.EMBEDDING === datasource.status
			? <ProgressBar total={datasource.recordCount?.total} success={datasource.recordCount?.success} failure={datasource.recordCount?.failure} />
			: <div className={`max-w-[300px] px-3 py-[2px] text-sm text-white text-center rounded-full capitalize ${(processingOrEmbedding && !finished) ? 'barberpole' : datasourceStatusColors[finished ? DatasourceStatus.READY : datasource.status]}`}>
				{datasource.status || 'Unknown'}{!finished && <ButtonSpinner size={14} className='ms-2 -me-1' />}
			</div>}
	</span>;
}

export default DatasourceStatusIndicator;
