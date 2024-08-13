import Spinner from 'components/Spinner';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import * as API from '../../../api';
import TaskForm from '../../../components/TaskForm'; // Assuming you have a TaskForm component
import { useAccountContext } from '../../../context/account';

export default function AddTask(props) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [cloneState, setCloneState] = useState(null);
	const [error, setError] = useState();
	const { tasks, tools, agents } = state;

	async function fetchTaskFormData() {
		await API.getTasks({ resourceSlug }, dispatch, setError, router);
	}

	async function fetchEditData(taskId) {
		await API.getTask({ resourceSlug, taskId }, setCloneState, setError, router);
	}

	useEffect(() => {
		fetchTaskFormData();
	}, [resourceSlug]);

	useEffect(() => {
		if (typeof location != undefined) {
			const taskId = new URLSearchParams(location.search).get('taskId');
			fetchEditData(taskId);
		}
	}, []);

	if (tasks == null) {
		return <Spinner />;
	}
	console.log(tasks);
	console.log(props);

	return (
		<>
			<Head>
				<title>{`New Task - ${teamName}`}</title>
			</Head>

			<span className='sm: w-full md:w-1/2 xl:w-1/3'>
				<TaskForm
					tools={tools}
					agents={agents}
					fetchTaskFormData={fetchTaskFormData}
					task={cloneState?.task}
					taskChoices={tasks}
					editing={false}
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
