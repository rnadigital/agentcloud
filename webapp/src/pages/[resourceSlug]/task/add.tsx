import * as API from '@api';
import Spinner from 'components/Spinner';
import TaskForm from 'components/TaskForm';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function AddTask(props) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [cloneState, setCloneState] = useState(null);
	const [error, setError] = useState();
	const [loading, setLoading] = useState(true);
	const { tasks, tools, agents, variables } = state;

	async function fetchTaskFormData() {
		await API.getTasks({ resourceSlug }, dispatch, setError, router);
	}

	async function fetchEditData(taskId) {
		await API.getTaskById({ resourceSlug, taskId }, setCloneState, setError, router);
	}

	useEffect(() => {
		fetchTaskFormData();
	}, [resourceSlug]);

	useEffect(() => {
		if (typeof location != undefined) {
			const taskId = new URLSearchParams(location.search).get('taskId');
			if (taskId) {
				fetchEditData(taskId);
			} else {
				setLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		if (cloneState != null) {
			setLoading(false);
		}
	}, [cloneState]);

	if (loading) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`New Task - ${teamName}`}</title>
			</Head>

			<span className='sm: w-full md:w-1/2'>
				<TaskForm
					tools={tools}
					agents={agents}
					fetchTaskFormData={fetchTaskFormData}
					task={cloneState?.task}
					taskChoices={tasks}
					editing={false}
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
