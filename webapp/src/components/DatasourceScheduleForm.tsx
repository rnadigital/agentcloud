'use strict';

import 'react-js-cron/dist/styles.css';

import classNames from 'components/ClassNames';
import { useAccountContext } from 'context/account';
import { Cron } from 'react-js-cron';
import { pricingMatrix } from 'struct/billing';
import { DatasourceScheduleType } from 'struct/datasource';

const scheduleOptions = [
	{ value: 'minute', label: 'Every Minute' },
	{ value: 'hour', label: 'Hourly' },
	{ value: 'day', label: 'Daily' },
	{ value: 'week', label: 'Weekly' },
	{ value: 'month', label: 'Monthly' }
];

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
	const cronProps = pricingMatrix[stripePlan]?.cronProps;
	return (
		<>
			<div className=''>
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
						<option disabled={!cronProps?.allowedPeriods} value={DatasourceScheduleType.CRON}>
							Scheduled
						</option>
					</select>
				</div>
			</div>

			{scheduleType === DatasourceScheduleType.CRON && (
				<div className=''>
					<label
						htmlFor='timeUnit'
						className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400 mt-2'
					>
						Frequency
					</label>
					<div>
						<select
							required
							name='timeUnit'
							id='timeUnit'
							onChange={e => setTimeUnit(e.target.value)}
							value={timeUnit}
							className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
						>
							{scheduleOptions.map(option => {
								if (cronProps?.allowedPeriods?.includes(option.value)) {
									return (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									);
								}
								return null;
							})}
						</select>
					</div>
				</div>
			)}

			{/*scheduleType === DatasourceScheduleType.CRON && (
				<div>
					<Cron
						value={cronExpression}
						setValue={setCronExpression}
						{...cronProps}
					/>
					<label
						htmlFor='cronExpression'
						className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
					>
						Cron Expression
					</label>
					<div>
						<input
							required
							disabled={cronProps?.disabled === true}
							type='text'
							name='cronExpression'
							id='cronExpression'
							onChange={e => setCronExpression(e.target.value)}
							value={cronExpression}
							className={classNames('block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white mb-4',
								cronProps?.disabled === true ? 'disabled:bg-gray-200 cursor-not-allowed' : '')}
						/>
					</div>
				</div>
			)*/}
		</>
	);
}
