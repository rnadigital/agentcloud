import DatasourceScheduleForm from 'components/DatasourceScheduleForm';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useConnectionsStore } from 'store/connections';
import { DatasourceScheduleType } from 'struct/datasource';
import { useShallow } from 'zustand/react/shallow';

const Schedule = () => {
	const [editingSchedule, setEditingSchedule] = useState(false);

	const router = useRouter();

	const { scheduleType, timeUnit, units, cronExpression, setStore, updateSchedule, submitting } =
		useConnectionsStore(
			useShallow(state => ({
				scheduleType: state.scheduleType,
				timeUnit: state.timeUnit,
				units: state.units,
				cronExpression: state.cronExpression,
				setStore: state.setStore,
				updateSchedule: state.updateSchedule,
				submitting: state.submitting
			}))
		);

	const setScheduleType = (type: DatasourceScheduleType) => {
		setStore({ scheduleType: type });
	};

	const setTimeUnit = (unit: string) => {
		setStore({ timeUnit: unit });
	};

	const setUnits = (value: number) => {
		setStore({ units: value });
	};

	const setCronExpression = (cronExpression: string) => {
		setStore({ cronExpression });
	};

	return (
		<div>
			<DatasourceScheduleForm
				scheduleType={scheduleType}
				setScheduleType={setScheduleType}
				timeUnit={timeUnit}
				setTimeUnit={setTimeUnit}
				units={units}
				setUnits={setUnits}
				cronExpression={cronExpression}
				setCronExpression={setCronExpression}
			/>
			<div className='flex space-x-2 mt-4'>
				<button
					onClick={async e => {
						await updateSchedule({
							scheduleType,
							timeUnit,
							cronExpression,
							router
						});
						setEditingSchedule(false);
					}}
					disabled={submitting['updateStreams']}
					type='submit'
					className={
						'flex rounded-md bg-indigo-600 px-2 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-200'
					}
				>
					Save
				</button>
				{editingSchedule && (
					<button
						onClick={e => {
							setEditingSchedule(false);
						}}
						type='submit'
						className={
							'flex rounded-md disabled:bg-slate-400 bg-gray-600 px-2 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600'
						}
					>
						Cancel
					</button>
				)}
			</div>
		</div>
	);
};

export default Schedule;
