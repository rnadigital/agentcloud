'use strict';

import * as API from '@api';
import CreateToolModal from 'components/CreateToolModal';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import SelectClassNames from 'styles/SelectClassNames';

export default function TaskForm({ task = {}, tools = [], editing, compact = false, callback, fetchTaskFormData }
  : { task?: any, tools?: any[], editing?: boolean, compact?: boolean, callback?: Function, fetchTaskFormData?: Function }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const [modalOpen, setModalOpen] = useState(false);
	const { resourceSlug } = router.query;
	const [taskState, setTask] = useState(task);

	const { _id, description, expectedOutput, toolIds } = taskState;

	const initialTools = task.toolIds && task.toolIds
		.map(tid => {
			const foundTool = tools.find(t => t._id === tid);
			if (!foundTool) { return null; }
			return { label: foundTool.name, value: foundTool._id };
		})
		.filter(t => t);

	useEffect(() => {
	    // Placeholder for any initial setup or effects
	}, []);

	async function taskPost(e) {
		e.preventDefault();
		const body: any = {
			_csrf: e.target._csrf.value,
			resourceSlug,
			name: e.target.name.value,
			description: e.target.description.value,
			expectedOutput: e.target.expectedOutput.value,
			toolIds: taskState?.toolIds,
			asyncExecution: e.target.asyncExecution.checked,
		};
		if (editing) {
			await API.editTask(taskState._id, body, () => {
				toast.success('Task Updated');
			}, (res) => {
				toast.error(res);
			}, null);
		} else {
			const addedTask: any = await API.addTask(body, () => {
				toast.success('Added new task');
			}, (res) => {
				toast.error(res);
			}, compact ? null : router);
			callback && addedTask && callback(addedTask._id);
		}
	}

	const toolCallback = async (addedToolId) => {
		await fetchTaskFormData && fetchTaskFormData();
		setModalOpen(false);
		setTask(oldTask => {
			return {
				...oldTask,
				toolIds: [...(taskState?.toolIds||[]), addedToolId],
			};
		});
	};

	return (
		<>
			<CreateToolModal open={modalOpen} setOpen={setModalOpen} callback={toolCallback} />
			<form onSubmit={taskPost}>
				<input
					type='hidden'
					name='_csrf'
					value={csrf}
				/>
				<div className={`space-y-${compact ? '6' : '12'}`}>
					{/* Task description and expected output fields */}
					<div className='grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3'>
						<div className='col-span-full'>
							<label htmlFor='description' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Task Description
							</label>
							<textarea
								required
								id='description'
								name='description'
								rows={4}
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								defaultValue={description}
							/>
						</div>

						<div className='col-span-full'>
							<label htmlFor='expectedOutput' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Expected Output
							</label>
							<textarea
								required
								id='expectedOutput'
								name='expectedOutput'
								rows={4}
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
								defaultValue={expectedOutput}
							/>
						</div>

						{/* Tool selection */}
						<div className='col-span-full'>
							<label htmlFor='toolIds' className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Tools (Optional)
							</label>
							<Select
								isSearchable
								isMultiple
								primaryColor={'indigo'}
								classNames={SelectClassNames}
								value={taskState?.toolIds?.map(x => ({ value: x, label: tools.find(tx => tx._id === x)?.name}))}
								onChange={(v: any) => {
									if (v?.some(vals => vals.value === null)) {
										//Create new pressed
										return setModalOpen(true);
									}
									setTask(oldTask => {
										return {
											...oldTask,
											toolIds: v?.map(x => x.value),
										};
									});
								}}
								options={tools.map(t => ({ label: t.name, value: t._id })).concat([{ label: '+ New Tool', value: null }])}
					            formatOptionLabel={data => {
									const optionTool = tools.find(oc => oc._id === data.value);
					                return (<li
					                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 	${
					                        data.isSelected
					                            ? 'bg-blue-100 text-blue-500'
					                            : 'dark:text-white'
					                    }`}
					                >
					                    {data.label} {optionTool ? `(${optionTool?.type})` : null}
					                </li>);
					            }}
							/>
						</div>

						{/* Async execution checkbox */}
						<div className='col-span-full'>
							<div className='mt-2'>
								<div className='sm:col-span-12'>
									<label htmlFor='asyncExecution' className='select-none flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
										<input
											type='checkbox'
											id='asyncExecution'
											name='asyncExecution'
											checked={taskState?.asyncExecution === true}
											onChange={e => {
												setTask(oldTask => {
													return {
														...oldTask,
														asyncExecution: e.target.checked,
													};
												});
											}}
											className='mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
										/>
										Async Execution
									</label>
								</div>
							</div>
						</div>

					</div>
				</div>

				<div className='mt-6 flex items-center justify-between gap-x-6'>
					{!compact && <Link href={`/${resourceSlug}/tasks`}>
						Back
					</Link>}
					<button
						type='submit'
						className={`rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${compact ? 'w-full' : ''}`}
					>
						Save
					</button>
				</div>
			</form>
		</>
	);
}
