import * as API from '@api';
import TaskForm from 'components/TaskForm'; // Assuming you have a TaskForm component
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function EditTask(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { task, tools } = state; // Assuming tasks need tools

	async function fetchTaskFormData() {
		await API.getTask({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchTaskFormData();
	}, [resourceSlug]);

	if (task == null) {
		return 'Loading...'; //TODO: Implement a better loading indicator
	}

	return (
		<>
			<Head>
				<title>{`Edit Task - ${teamName}`}</title>
			</Head>

			<TaskForm task={task} tools={tools} fetchTaskFormData={fetchTaskFormData} editing={true} />

		</>
	);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
