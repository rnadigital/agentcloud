import * as API from '@api';
import Spinner from 'components/Spinner';
import TaskForm from 'components/TaskForm'; // Assuming you have a TaskForm component
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Task } from 'struct/task';

export default function EditTask(props) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug, taskId } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { task, tools, agents, tasks, variables } = state; // Assuming tasks need tools

	const taskChoices = tasks?.filter(x => x._id.toString() !== task._id.toString()) || [];

	async function fetchTaskFormData() {
		await API.getTaskById(
			{
				resourceSlug,
				taskId
			},
			dispatch,
			setError,
			router
		);
	}

	useEffect(() => {
		fetchTaskFormData();
	}, [resourceSlug]);

	if (task == null) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`Edit Task - ${teamName}`}</title>
			</Head>

			<div className='border-b pb-2 my-2 mb-6'>
				<h3 className='font-semibold text-gray-900'>Edit Task</h3>
			</div>

			<span className='sm: w-full md:w-1/2 xl:w-1/3'>
				<TaskForm
					task={task}
					tools={tools}
					agents={agents}
					fetchTaskFormData={fetchTaskFormData}
					editing={true}
					taskChoices={taskChoices}
					variables={variables}
				/>
			</span>
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
