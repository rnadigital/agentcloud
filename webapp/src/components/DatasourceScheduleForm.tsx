'use strict';

import { InformationCircleIcon } from '@heroicons/react/20/solid';
import dynamic from 'next/dynamic';
import { DatasourceScheduleType } from 'struct/datasource';
// @ts-ignore
const Markdown = dynamic(() => import('react-markdown'), {
	loading: () => <p className='markdown-content'>Loading...</p>,
	ssr: false
});
import rehypeRaw from 'rehype-raw';

export default function DatasourceScheduleForm({
	scheduleType,
	setScheduleType,
	timeUnit,
	setTimeUnit,
	units,
	setUnits,
	cronExpression,
	setCronExpression,
	cronTimezone,
	setCronTimezone
}) {
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
					<option value={DatasourceScheduleType.CRON}>Cron</option>
				</select>
			</div>
			{/*scheduleType === DatasourceScheduleType.BASICSCHEDULE && <>
			<label htmlFor='timeUnit' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-2'>
				Time Unit
			</label>
			<div>
				<select
					required
					name='timeUnit'
					id='timeUnit'
					onChange={(e) => setTimeUnit(e.target.value)}
					value={timeUnit}
					className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
				>
					<option value='minutes'>minutes</option>
					<option value='hours'>hours</option>
					<option value='days'>days</option>
					<option value='weeks'>weeks</option>
					<option value='months'>months</option>
				</select>
			</div>
			<label htmlFor='units' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-2'>
				Units
			</label>
			<div>
				<input
					required
					type='number'
					name='units'
					id='units'
					onChange={(e) => setUnits(e.target.value)}
					value={units}
					className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
				/>
			</div>
		</>*/}
			{scheduleType === DatasourceScheduleType.CRON && (
				<>
					<label
						htmlFor='cronExpression'
						className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-2'
					>
						Cron Expression
						<span className='tooltip'>
							<span className='text-gray-400 hover:text-gray-600 cursor-pointer'>
								<InformationCircleIcon className='ms-1 h-4 w-4' />
							</span>
							<span className='tooltiptext'>
								<Markdown rehypePlugins={[rehypeRaw as any]} className={'markdown-content'}>
									{
										"Cron expression builder: <a target='_blank' href='https://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/crontrigger.html'>https://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/crontrigger.html</a>"
									}
								</Markdown>
							</span>
						</span>
					</label>
					<div>
						<input
							required
							type='text'
							name='cronExpression'
							id='cronExpression'
							onChange={e => setCronExpression(e.target.value)}
							value={cronExpression}
							className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
						/>
					</div>
					{/*<label htmlFor='cronTimezone' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-2'>
				Timezone
			</label>
			<div>
				<select
					required
					name='cronTimezone'
					id='cronTimezone'
					onChange={(e) => setCronTimezone(e.target.value)}
					value={cronTimezone}
					className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
				>
					{Intl.supportedValuesOf('timeZone').map((tz, tzi) => (<option key={`tz_${tzi}`} value={tz}>{tz}</option>))}
				</select>
			</div>*/}
				</>
			)}
		</>
	);
}
