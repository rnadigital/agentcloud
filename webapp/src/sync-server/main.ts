'use strict';

process.on('uncaughtException', console.error).on('unhandledRejection', console.error);

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import getAirbyteApi, { AirbyteApiType, fetchAllAirbyteJobs } from 'airbyte/api';
import { getAccountById } from 'db/account';
import { getDatasourceByConnectionId, setDatasourceStatus } from 'db/datasource';
import * as db from 'db/index';
import { migrate } from 'db/migrate';
import { getOrgById } from 'db/org';
import debug from 'debug';
import * as redis from 'redis/redis';
import { pricingMatrix } from 'struct/billing';
import { AugmentedJob } from 'struct/syncserver';

import getAirbyteInternalApi from '../lib/airbyte/internal';
import { DatasourceStatus } from '../lib/struct/datasource';
import VectorDBProxyClient from '../lib/vectorproxy/client';
const log = debug('sync-server:main');

/*
	// await vectorLimitTaskQueue.add(
	// 	'sync',
	// 	{
	// 		data: 'test'
	// 	},
	// 	{ removeOnComplete: true, removeOnFail: true }
	// );
*/

async function augmentJobs(jobList) {
	const connectionsApi = await getAirbyteApi(AirbyteApiType.CONNECTIONS);
	const internalApi = await getAirbyteInternalApi();
	const augmentedJobs = await Promise.all(
		jobList.map(async job => {
			// get the actual rows/bytes synced from the internal airbyte API because the official one only returns committed values
			try {
				const getConnectionSyncProgressBody = {
					connectionId: job?.connectionId
				};
				const connectionSyncProgress = await internalApi
					.getConnectionSyncProgress(null, getConnectionSyncProgressBody)
					.then(res => res.data);
				if (connectionSyncProgress) {
					connectionSyncProgress.bytesEmitted &&
						(job.bytesSynced = connectionSyncProgress.bytesEmitted);
					connectionSyncProgress.recordsEmitted &&
						(job.rowsSynced = connectionSyncProgress.recordsEmitted);
				}
			} catch (e) {
				console.log(e);
			}

			// fetch and attach the full airbyte "connection" object based on the jobs connectionId
			let foundConnection;
			try {
				foundConnection = await connectionsApi
					.getConnection(job.connectionId)
					.then(res => res.data);
				if (foundConnection) {
					job.connection = foundConnection;
				}
			} catch (e) {
				log(e);
			}

			// fetch and attach the the datasource from mongo based on the jobs connectionId
			let foundDatasource;
			try {
				foundDatasource = await getDatasourceByConnectionId(job.connectionId);
				if (foundDatasource) {
					job.datasource = foundDatasource;
					// find the org -> ownerId -> account.stripe to know the limits for this connection
					let limitOwnerId;
					const datasourceOrg = await getOrgById(foundDatasource?.orgId);
					if (datasourceOrg) {
						limitOwnerId = datasourceOrg?.ownerId;
					}
					const ownerAccount = await getAccountById(limitOwnerId);
					const ownerOrg = await getOrgById(ownerAccount?.currentOrg);
					job.stripe = ownerOrg?.stripe;
				}
			} catch (e) {
				log(e);
			}

			return job;
		})
	);
	return augmentedJobs;
}

async function main() {
	await db.connect();
	await migrate();
	const gracefulStop = () => {
		log('SIGINT SIGNAL RECEIVED');
		db.client().close();
		redis.close();
		process.exit(0);
	};
	process.on('SIGINT', gracefulStop);
	process.on('message', message => message === 'shutdown' && gracefulStop());
	if (typeof process.send === 'function') {
		log('SENT READY SIGNAL TO PM2');
		process.send('ready');
	}

	// start a loop to fetch all jobs and submit to queue every x seconds
	const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
	while (true) {
		const jobList = await fetchAllAirbyteJobs();

		//TODO: move to worker
		const augmentedJobs: AugmentedJob[] = await augmentJobs(jobList);
		for (let job of augmentedJobs) {
			log('job', job?.jobId, 'rows synced', job?.rowsSynced);
			const teamVectorStorage = await VectorDBProxyClient.getVectorStorageForTeam(
				job?.datasource?.teamId
			);
			const storageVectorCount = teamVectorStorage?.data?.total_points;
			log('current vector storage count:', storageVectorCount);
			let vectorCountLimit = 0;
			const planLimits = pricingMatrix[job?.stripe?.stripePlan];
			if (planLimits) {
				const approxVectorCountLimit = Math.floor(
					planLimits.maxVectorStorageBytes / (1536 * (32 / 8))
				); //Note: inaccurate because there are other embedding models
				log('plan approx. max vector count:', approxVectorCountLimit);
				vectorCountLimit = approxVectorCountLimit;
			}
			if (storageVectorCount + job?.rowsSynced > vectorCountLimit) {
				log(
					'job',
					job?.jobId,
					'exceeded',
					vectorCountLimit,
					'rows, sending reset job (cancel sync)'
				);
				//set the datasource to "error" state
				setDatasourceStatus(job?.datasource?.teamId, job?.datasource?._id, DatasourceStatus.ERROR);
				//cancel the job
				try {
					const jobsApi = await getAirbyteApi(AirbyteApiType.JOBS);
					const jobBody = {
						jobId: job.jobId
					};
					const resetJob = await jobsApi.cancelJob(jobBody).then(res => res.data);
					log('cancelJob', resetJob);
				} catch (e) {
					// Continue but log a warning if the reset job api call fails
					console.warn(e);
				}
			}
		}

		await new Promise(res => setTimeout(res, 2000));
	}
}

main();
