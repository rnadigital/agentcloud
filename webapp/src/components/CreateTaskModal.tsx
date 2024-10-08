'use strict';

import * as API from '@api';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import TaskForm from 'components/TaskForm';
import { useAccountContext } from 'context/account';
import { TasksDataReturnType } from 'controllers/task';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';

export default function CreateTaskModal({ open, setOpen, callback }) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState<TasksDataReturnType>();
	const [error, setError] = useState();
	const { tools, tasks, agents, variables } = state || {};

	async function fetchTaskFormData() {
		await API.getTasks({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchTaskFormData();
	}, []);

	return (
		<Transition show={open} as={Fragment}>
			<Dialog as='div' className='relative z-50' onClose={setOpen}>
				<TransitionChild
					as={Fragment}
					enter='ease-out duration-300'
					enterFrom='opacity-0'
					enterTo='opacity-100'
					leave='ease-in duration-200'
					leaveFrom='opacity-100'
					leaveTo='opacity-0'
				>
					<div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
				</TransitionChild>

				<div className='fixed inset-0 z-10 overflow-y-auto'>
					<div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
						<TransitionChild
							as={Fragment}
							enter='ease-out duration-300'
							enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
							enterTo='opacity-100 translate-y-0 sm:scale-100'
							leave='ease-in duration-200'
							leaveFrom='opacity-100 translate-y-0 sm:scale-100'
							leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
						>
							<DialogPanel className='relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:p-6 sm:w-full sm:max-w-lg dark:bg-slate-800'>
								<div>
									<DialogTitle
										as='h3'
										className='text-lg font-medium leading-6 text-gray-900 dark:text-white'
									>
										Add New Task
									</DialogTitle>
									<div className='mt-2'>
										<TaskForm
											compact={true}
											callback={callback}
											tools={tools}
											agents={agents}
											fetchTaskFormData={fetchTaskFormData}
											taskChoices={tasks}
											variables={variables}
										/>
									</div>
								</div>
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
