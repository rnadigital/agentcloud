'use strict';

import { InformationCircleIcon } from '@heroicons/react/20/solid';
import dynamic from 'next/dynamic';
import { DatasourceScheduleType } from 'struct/datasource';
// @ts-ignore
const Markdown = dynamic(() => import('react-markdown'), {
	loading: () => <p className='markdown-content'>Loading...</p>,
	ssr: false
});
import 'react-js-cron/dist/styles.css';
import { useAccountContext } from 'context/account';
import { Cron } from 'react-js-cron';
import rehypeRaw from 'rehype-raw';
import { pricingMatrix } from 'struct/billing';

export default function DatasourceScheduleForm({
	scheduleType,
	setScheduleType,
	timeUnit,
	setTimeUnit,
	units,
	setUnits,
	cronExpression,
	setCronExpression
}) {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { account } = accountContext as any;
	const { stripePlan } = account?.stripe || {};
	const cronProps = pricingMatrix[stripePlan]?.syncFrequencyCron;
	return (
		<>
			<label
				htmlFor='scheduleType'
				className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-2'
			>
				Schedule Type<span className='text-red-700'> *</span>
			</label>
			<div>
				<select
					required
					name='scheduleType'
					id='scheduleType'
					onChange={e => setScheduleType(e.target.value)}
					value={scheduleType}
					className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
				>
					<option value={DatasourceScheduleType.MANUAL}>Manual</option>
					{/*<option value={DatasourceScheduleType.BASICSCHEDULE}>Basic Schedule</option>*/}
					<option value={DatasourceScheduleType.CRON}>Scheduled</option>
				</select>
			</div>
			{scheduleType === DatasourceScheduleType.CRON && (
				<>
					<label
						htmlFor='cronExpression'
						className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-2'
					>
						Cron Expression
					</label>
					<div>
						<input
							required
							type='text'
							name='cronExpression'
							id='cronExpression'
							onChange={e => setCronExpression(e.target.value)}
							value={cronExpression}
							className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white mb-4'
						/>
					</div>
					<Cron value={cronExpression} setValue={setCronExpression} {...cronProps} />
				</>
			)}
		</>
	);
}
