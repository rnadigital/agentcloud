import * as API from '@api';
import { StreamsList } from 'components/DatasourceStream';
import ErrorAlert from 'components/ErrorAlert';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import submittingReducer from 'lib/utils/submittingreducer';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useReducer, useState } from 'react';
import { toast } from 'react-toastify';

export default function Account(props) {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { resourceSlug } = router.query;

	function fetchAccount() {
		API.getAccount({ resourceSlug }, dispatch, setError, router);
	}

	const [_streamState, setStreamReducer] = useReducer(submittingReducer, {});

	useEffect(() => {
		fetchAccount();
	}, [resourceSlug]);

	if (!account) {
		return <Spinner />;
	}

	const { discoveredSchema, streamProperties }: any = {
		sourceId: '38326b79-edca-4cb3-b2dd-00272cac23a9',
		discoveredSchema: {
			catalog: {
				streams: [
					{
						stream: {
							name: 'elon_tweets_2022',
							jsonSchema: {
								type: 'object',
								properties: {
									Retweets: { airbyte_type: 'integer', type: 'number' },
									Likes: { airbyte_type: 'integer', type: 'number' },
									Date: { type: 'string' },
									Cleaned_Tweets: { type: 'string' }
								}
							},
							supportedSyncModes: ['full_refresh', 'incremental'],
							sourceDefinedCursor: true,
							defaultCursorField: [],
							sourceDefinedPrimaryKey: [],
							namespace: 'agentcloud_sample'
						},
						config: {
							syncMode: 'full_refresh',
							cursorField: [],
							destinationSyncMode: 'overwrite',
							primaryKey: [],
							aliasName: 'elon_tweets_2022',
							selected: false,
							suggested: false,
							selectedFields: []
						}
					},
					{
						stream: {
							name: 'elon_tweets_2022_small',
							jsonSchema: {
								type: 'object',
								properties: {
									Retweets: { airbyte_type: 'integer', type: 'number' },
									Likes: { airbyte_type: 'integer', type: 'number' },
									Date: { type: 'string' },
									Cleaned_Tweets: { type: 'string' }
								}
							},
							supportedSyncModes: ['full_refresh', 'incremental'],
							sourceDefinedCursor: false,
							defaultCursorField: [],
							sourceDefinedPrimaryKey: [],
							namespace: 'agentcloud_sample'
						},
						config: {
							syncMode: 'full_refresh',
							cursorField: [],
							destinationSyncMode: 'overwrite',
							primaryKey: [],
							aliasName: 'elon_tweets_2022_small',
							selected: false,
							suggested: false,
							selectedFields: []
						}
					},
					{
						stream: {
							name: 'recipe_csv',
							jsonSchema: {
								type: 'object',
								properties: {
									best_score: { airbyte_type: 'integer', type: 'number' },
									thumbs_down: { airbyte_type: 'integer', type: 'number' },
									user_name: { type: 'string' },
									created_at: { airbyte_type: 'integer', type: 'number' },
									user_reputation: { airbyte_type: 'integer', type: 'number' },
									stars: { airbyte_type: 'integer', type: 'number' },
									comment_id: { type: 'string' },
									reply_count: { airbyte_type: 'integer', type: 'number' },
									thumbs_up: { airbyte_type: 'integer', type: 'number' },
									cleaner_text: { type: 'string' },
									user_id: { type: 'string' },
									recipe_number: { airbyte_type: 'integer', type: 'number' },
									recipe_name: { type: 'string' },
									recipe_code: { airbyte_type: 'integer', type: 'number' }
								}
							},
							supportedSyncModes: ['full_refresh', 'incremental'],
							sourceDefinedCursor: false,
							defaultCursorField: [],
							sourceDefinedPrimaryKey: [],
							namespace: 'agentcloud_sample'
						},
						config: {
							syncMode: 'full_refresh',
							cursorField: [],
							destinationSyncMode: 'overwrite',
							primaryKey: [],
							aliasName: 'recipe_csv',
							selected: false,
							suggested: false,
							selectedFields: []
						}
					},
					{
						stream: {
							name: 'recipe_reviews',
							jsonSchema: {
								type: 'object',
								properties: {
									best_score: { airbyte_type: 'integer', type: 'number' },
									thumbs_down: { airbyte_type: 'integer', type: 'number' },
									user_name: { type: 'string' },
									cleaned_text: { type: 'string' },
									created_at: { airbyte_type: 'integer', type: 'number' },
									user_reputation: { airbyte_type: 'integer', type: 'number' },
									stars: { airbyte_type: 'integer', type: 'number' },
									comment_id: { type: 'string' },
									reply_count: { airbyte_type: 'integer', type: 'number' },
									thumbs_up: { airbyte_type: 'integer', type: 'number' },
									user_id: { type: 'string' },
									recipe_number: { airbyte_type: 'integer', type: 'number' },
									recipe_name: { type: 'string' },
									recipe_code: { airbyte_type: 'integer', type: 'number' }
								}
							},
							supportedSyncModes: ['full_refresh', 'incremental'],
							sourceDefinedCursor: false,
							defaultCursorField: [],
							sourceDefinedPrimaryKey: [],
							namespace: 'agentcloud_sample'
						},
						config: {
							syncMode: 'full_refresh',
							cursorField: [],
							destinationSyncMode: 'overwrite',
							primaryKey: [],
							aliasName: 'recipe_reviews',
							selected: false,
							suggested: false,
							selectedFields: []
						}
					},
					{
						stream: {
							name: 'twitter_sentiment',
							jsonSchema: {
								type: 'object',
								properties: {
									tweet_id: { airbyte_type: 'integer', type: 'number' },
									tweet_content: { type: 'string' },
									entity: { type: 'string' }
								}
							},
							supportedSyncModes: ['full_refresh', 'incremental'],
							sourceDefinedCursor: false,
							defaultCursorField: [],
							sourceDefinedPrimaryKey: [],
							namespace: 'agentcloud_sample'
						},
						config: {
							syncMode: 'full_refresh',
							cursorField: [],
							destinationSyncMode: 'overwrite',
							primaryKey: [],
							aliasName: 'twitter_sentiment',
							selected: false,
							suggested: false,
							selectedFields: []
						}
					}
				]
			},
			jobInfo: {
				id: '7fa0a9dc-3097-4859-be05-9730f3acb88f',
				configType: 'discover_schema',
				configId: 'Optional[bfd1ddf8-ae8a-4620-b1d7-55597d2ba08c]',
				createdAt: 1724202562065,
				endedAt: 1724202567198,
				succeeded: true,
				connectorConfigurationUpdated: false,
				logs: {
					logLines: [
						'2024-08-21 01:09:22 \u001b[46mplatform\u001b[0m > Docker volume job log path: /tmp/workspace/7fa0a9dc-3097-4859-be05-9730f3acb88f/0/logs.log',
						'2024-08-21 01:09:22 \u001b[46mplatform\u001b[0m > Executing worker wrapper. Airbyte version: 0.63.9',
						'2024-08-21 01:09:22 \u001b[46mplatform\u001b[0m > ',
						"2024-08-21 01:09:22 \u001b[46mplatform\u001b[0m > Using default value for environment variable SIDECAR_KUBE_CPU_LIMIT: '2.0'",
						'2024-08-21 01:09:22 \u001b[46mplatform\u001b[0m > ----- START DISCOVER SOURCE CATALOG -----',
						"2024-08-21 01:09:22 \u001b[46mplatform\u001b[0m > Using default value for environment variable SOCAT_KUBE_CPU_LIMIT: '2.0'",
						"2024-08-21 01:09:22 \u001b[46mplatform\u001b[0m > Using default value for environment variable SIDECAR_KUBE_CPU_REQUEST: '0.1'",
						'2024-08-21 01:09:22 \u001b[46mplatform\u001b[0m > ',
						"2024-08-21 01:09:22 \u001b[46mplatform\u001b[0m > Using default value for environment variable SOCAT_KUBE_CPU_REQUEST: '0.1'",
						'2024-08-21 01:09:22 \u001b[46mplatform\u001b[0m > Checking if airbyte/source-bigquery:0.4.2 exists...',
						'2024-08-21 01:09:22 \u001b[46mplatform\u001b[0m > airbyte/source-bigquery:0.4.2 was found locally.',
						'2024-08-21 01:09:22 \u001b[46mplatform\u001b[0m > Creating docker container = source-bigquery-discover-7fa0a9dc-3097-4859-be05-9730f3acb88f-0-cpgsm with resources io.airbyte.config.ResourceRequirements@5518a68e[cpuRequest=,cpuLimit=,memoryRequest=,memoryLimit=,additionalProperties={}] and allowedHosts null',
						'2024-08-21 01:09:22 \u001b[46mplatform\u001b[0m > Preparing command: docker run --rm --init -i -w /data/7fa0a9dc-3097-4859-be05-9730f3acb88f/0 --log-driver none --name source-bigquery-discover-7fa0a9dc-3097-4859-be05-9730f3acb88f-0-cpgsm --network host -v airbyte_workspace:/data -v oss_local_root:/local -e DEPLOYMENT_MODE=OSS -e WORKER_CONNECTOR_IMAGE=airbyte/source-bigquery:0.4.2 -e AUTO_DETECT_SCHEMA=true -e LAUNCHDARKLY_KEY= -e SOCAT_KUBE_CPU_REQUEST=0.1 -e SOCAT_KUBE_CPU_LIMIT=2.0 -e FIELD_SELECTION_WORKSPACES= -e USE_STREAM_CAPABLE_STATE=true -e AIRBYTE_ROLE=dev -e WORKER_ENVIRONMENT=DOCKER -e APPLY_FIELD_SELECTION=false -e WORKER_JOB_ATTEMPT=0 -e OTEL_COLLECTOR_ENDPOINT=http://host.docker.internal:4317 -e FEATURE_FLAG_CLIENT=config -e AIRBYTE_VERSION=0.63.9 -e WORKER_JOB_ID=7fa0a9dc-3097-4859-be05-9730f3acb88f airbyte/source-bigquery:0.4.2 discover --config source_config.json',
						'2024-08-21 01:09:22 \u001b[46mplatform\u001b[0m > Reading messages from protocol version 0.2.0',
						'2024-08-21 01:09:23 \u001b[46mplatform\u001b[0m > INFO i.a.i.s.b.BigQuerySource(main):219 starting source: class io.airbyte.integrations.source.bigquery.BigQuerySource',
						'2024-08-21 01:09:23 \u001b[46mplatform\u001b[0m > INFO i.a.c.i.b.IntegrationCliParser(parseOptions):126 integration args: {discover=null, config=source_config.json}',
						'2024-08-21 01:09:23 \u001b[46mplatform\u001b[0m > INFO i.a.c.i.b.IntegrationRunner(runInternal):132 Running integration: io.airbyte.integrations.source.bigquery.BigQuerySource',
						'2024-08-21 01:09:23 \u001b[46mplatform\u001b[0m > INFO i.a.c.i.b.IntegrationRunner(runInternal):133 Command: DISCOVER',
						"2024-08-21 01:09:23 \u001b[46mplatform\u001b[0m > INFO i.a.c.i.b.IntegrationRunner(runInternal):134 Integration config: IntegrationConfig{command=DISCOVER, configPath='source_config.json', catalogPath='null', statePath='null'}",
						'2024-08-21 01:09:23 \u001b[46mplatform\u001b[0m > WARN c.n.s.JsonMetaSchema(newValidator):278 Unknown keyword airbyte_secret - you should define your own Meta Schema. If the keyword is irrelevant for validation, just use a NonValidationKeyword',
						'2024-08-21 01:09:27 \u001b[46mplatform\u001b[0m > INFO i.a.c.i.b.IntegrationRunner(runInternal):231 Completed integration: io.airbyte.integrations.source.bigquery.BigQuerySource',
						'2024-08-21 01:09:27 \u001b[46mplatform\u001b[0m > INFO i.a.i.s.b.BigQuerySource(main):221 completed source: class io.airbyte.integrations.source.bigquery.BigQuerySource',
						'2024-08-21 01:09:27 \u001b[46mplatform\u001b[0m > ',
						'2024-08-21 01:09:27 \u001b[46mplatform\u001b[0m > ----- END DISCOVER SOURCE CATALOG -----',
						'2024-08-21 01:09:27 \u001b[46mplatform\u001b[0m > '
					]
				}
			},
			catalogId: '83700c5f-a141-4cb1-9cdb-56193685d770'
		},
		streamProperties: [
			{
				streamName: 'elon_tweets_2022',
				syncModes: ['full_refresh_append', 'incremental_append'],
				defaultCursorField: [],
				sourceDefinedCursorField: false,
				sourceDefinedPrimaryKey: [],
				propertyFields: [['Retweets', 'abc'], ['Likes'], ['Date'], ['Cleaned_Tweets']]
			},
			{
				streamName: 'elon_tweets_2022_small',
				syncModes: ['full_refresh_append', 'incremental_append'],
				defaultCursorField: [],
				sourceDefinedCursorField: false,
				sourceDefinedPrimaryKey: [],
				propertyFields: [['Retweets'], ['Likes'], ['Date'], ['Cleaned_Tweets']]
			},
			{
				streamName: 'recipe_csv',
				syncModes: ['full_refresh_append', 'incremental_append'],
				defaultCursorField: [],
				sourceDefinedCursorField: false,
				sourceDefinedPrimaryKey: [],
				propertyFields: [
					['best_score'],
					['thumbs_down'],
					['user_name'],
					['created_at'],
					['user_reputation'],
					['stars'],
					['comment_id'],
					['reply_count'],
					['thumbs_up'],
					['cleaner_text'],
					['user_id'],
					['recipe_number'],
					['recipe_name'],
					['recipe_code']
				]
			},
			{
				streamName: 'recipe_reviews',
				syncModes: ['full_refresh_append', 'incremental_append'],
				defaultCursorField: [],
				sourceDefinedCursorField: false,
				sourceDefinedPrimaryKey: [],
				propertyFields: [
					['best_score'],
					['thumbs_down'],
					['user_name'],
					['cleaned_text'],
					['created_at'],
					['user_reputation'],
					['stars'],
					['comment_id'],
					['reply_count'],
					['thumbs_up'],
					['user_id'],
					['recipe_number'],
					['recipe_name'],
					['recipe_code']
				]
			},
			{
				streamName: 'twitter_sentiment',
				syncModes: ['full_refresh_append', 'incremental_append'],
				defaultCursorField: [],
				sourceDefinedCursorField: false,
				sourceDefinedPrimaryKey: [],
				propertyFields: [['tweet_id'], ['tweet_content'], ['entity']]
			}
		],
		datasourceId: '66c53e3834b9b70946b032c3'
	};

	return (
		<>
			<Head>
				<title>Account</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<div className='border-b dark:border-slate-400 pb-2 my-2'>
				<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>Account Settings</h3>
			</div>

			<StreamsList
				streams={discoveredSchema.catalog?.streams}
				streamProperties={streamProperties}
				setStreamReducer={setStreamReducer}
			/>

			<pre>{JSON.stringify(accountContext, null, 2)}</pre>
		</>
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
