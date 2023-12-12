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

		{/*<DynamicForm
			spec={{"sourceDefinitionId":"47f25999-dd5e-4636-8c39-e7cea2453331","documentationUrl":"https://docs.airbyte.com/integrations/sources/bing-ads","connectionSpecification":{"type":"object","title":"Bing Ads Spec","$schema":"http://json-schema.org/draft-07/schema#","required":["developer_token","client_id","refresh_token"],"properties":{"client_id":{"type":"string","order":1,"title":"Client ID","description":"The Client ID of your Microsoft Advertising developer application.","airbyte_secret":true},"tenant_id":{"type":"string","order":0,"title":"Tenant ID","default":"common","description":"The Tenant ID of your Microsoft Advertising developer application. Set this to \"common\" unless you know you need a different value.","airbyte_secret":true},"auth_method":{"type":"string","const":"oauth2.0"},"client_secret":{"type":"string","order":2,"title":"Client Secret","default":"","description":"The Client Secret of your Microsoft Advertising developer application.","airbyte_secret":true},"refresh_token":{"type":"string","order":3,"title":"Refresh Token","description":"Refresh Token to renew the expired Access Token.","airbyte_secret":true},"custom_reports":{"type":"array","items":{"type":"object","title":"Custom Report Config","required":["name","reporting_object","report_columns","report_aggregation"],"properties":{"name":{"type":"string","title":"Report Name","examples":["Account Performance","AdDynamicTextPerformanceReport","custom report"],"description":"The name of the custom report, this name would be used as stream name"},"report_columns":{"type":"array","items":{"type":"string","description":"Name of report column."},"title":"Columns","minItems":1,"description":"A list of available report object columns. You can find it in description of reporting object that you want to add to custom report."},"reporting_object":{"enum":["AccountPerformanceReportRequest","AdDynamicTextPerformanceReportRequest","AdExtensionByAdReportRequest","AdExtensionByKeywordReportRequest","AdExtensionDetailReportRequest","AdGroupPerformanceReportRequest","AdPerformanceReportRequest","AgeGenderAudienceReportRequest","AudiencePerformanceReportRequest","CallDetailReportRequest","CampaignPerformanceReportRequest","ConversionPerformanceReportRequest","DestinationUrlPerformanceReportRequest","DSAAutoTargetPerformanceReportRequest","DSACategoryPerformanceReportRequest","DSASearchQueryPerformanceReportRequest","GeographicPerformanceReportRequest","GoalsAndFunnelsReportRequest","HotelDimensionPerformanceReportRequest","HotelGroupPerformanceReportRequest","KeywordPerformanceReportRequest","NegativeKeywordConflictReportRequest","ProductDimensionPerformanceReportRequest","ProductMatchCountReportRequest","ProductNegativeKeywordConflictReportRequest","ProductPartitionPerformanceReportRequest","ProductPartitionUnitPerformanceReportRequest","ProductSearchQueryPerformanceReportRequest","ProfessionalDemographicsAudienceReportRequest","PublisherUsagePerformanceReportRequest","SearchCampaignChangeHistoryReportRequest","SearchQueryPerformanceReportRequest","ShareOfVoiceReportRequest","UserLocationPerformanceReportRequest"],"type":"string","title":"Reporting Data Object","description":"The name of the the object derives from the ReportRequest object. You can find it in Bing Ads Api docs - Reporting API - Reporting Data Objects."},"report_aggregation":{"type":"string","items":{"enum":["Hourly","Daily","Weekly","Monthly","DayOfWeek","HourOfDay","WeeklyStartingMonday","Summary"],"title":"ValidEnums","description":"An enumeration of aggregations."},"title":"Aggregation","default":["Hourly"],"description":"A list of available aggregations."}}},"order":7,"title":"Custom Reports","description":"You can add your Custom Bing Ads report by creating one."},"developer_token":{"type":"string","order":4,"title":"Developer Token","description":"Developer token associated with user. See more info <a href=\"https://docs.microsoft.com/en-us/advertising/guides/get-started?view=bingads-13#get-developer-token\"> in the docs</a>.","airbyte_secret":true},"lookback_window":{"type":"integer","order":6,"title":"Lookback window","default":0,"maximum":90,"minimum":0,"description":"Also known as attribution or conversion window. How far into the past to look for records (in days). If your conversion window has an hours/minutes granularity, round it up to the number of days exceeding. Used only for performance report streams in incremental mode without specified Reports Start Date."},"reports_start_date":{"type":"string","order":5,"title":"Reports replication start date","format":"date","description":"The start date from which to begin replicating report data. Any data generated before this date will not be replicated in reports. This is a UTC date in YYYY-MM-DD format. If not set, data from previous and current calendar year will be replicated."}},"additionalProperties":true},"advancedAuth":{"authFlowType":"oauth2.0","predicateKey":["auth_method"],"predicateValue":"oauth2.0","oauthConfigSpecification":{"oauthUserInputFromConnectorConfigSpecification":{"type":"object","properties":{"tenant_id":{"type":"string","path_in_connector_config":["tenant_id"]}},"additionalProperties":false},"completeOAuthOutputSpecification":{"type":"object","properties":{"refresh_token":{"type":"string","path_in_connector_config":["refresh_token"]}},"additionalProperties":false},"completeOAuthServerInputSpecification":{"type":"object","properties":{"client_id":{"type":"string"},"client_secret":{"type":"string"}},"additionalProperties":false},"completeOAuthServerOutputSpecification":{"type":"object","properties":{"client_id":{"type":"string","path_in_connector_config":["client_id"]},"client_secret":{"type":"string","path_in_connector_config":["client_secret"]}},"additionalProperties":false}}},"jobInfo":{"id":"d899d566-cdf5-436a-a31d-2882a4275e4f","configType":"get_spec","configId":"Optional.empty","createdAt":1702264659045,"endedAt":1702264659045,"succeeded":true,"connectorConfigurationUpdated":false,"logs":{"logLines":[]}}}}
		/>*/}

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
