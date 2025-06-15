'use strict';

import 'react-js-cron/dist/styles.css';

import { useAccountContext } from 'context/account';
import { pricingMatrix } from 'struct/billing';
import { DatasourceScheduleType } from 'struct/datasource';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from 'modules/components/ui/select';

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
					className='block text-sm font-medium leading-6 text-foreground mt-2'>
					Schedule Type<span className='text-destructive'> *</span>
				</label>
				<div>
					<Select value={scheduleType} onValueChange={setScheduleType} required>
						<SelectTrigger>
							<SelectValue placeholder='Select schedule type' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={DatasourceScheduleType.MANUAL}>Manual</SelectItem>
							{/*<option value={DatasourceScheduleType.BASICSCHEDULE}>Basic Schedule</option>*/}
							<SelectItem value={DatasourceScheduleType.CRON} disabled={!cronProps?.allowedPeriods}>
								Scheduled
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{scheduleType === DatasourceScheduleType.CRON && (
				<div className=''>
					<label
						htmlFor='timeUnit'
						className='block text-sm font-medium leading-6 text-foreground mt-2'>
						Frequency
					</label>
					<div>
						<Select value={timeUnit} onValueChange={setTimeUnit} required>
							<SelectTrigger>
								<SelectValue placeholder='Select frequency' />
							</SelectTrigger>
							<SelectContent>
								{scheduleOptions.map(option => {
									if (cronProps?.allowedPeriods?.includes(option.value)) {
										return (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										);
									}
									return null;
								})}
							</SelectContent>
						</Select>
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
						className='block text-sm font-medium leading-6 text-foreground'
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
							className={classNames(
								'block w-full rounded-md border border-input bg-background py-1.5 text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm sm:leading-6 mb-4',
								cronProps?.disabled === true ? 'disabled:bg-muted cursor-not-allowed' : ''
							)}
						/>
					</div>
				</div>
			)*/}
		</>
	);
}
