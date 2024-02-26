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
	const [error, setError] = useState();
	const { tasks, tools } = state; // Assuming tasks need tools

	async function fetchTaskFormData() {
// Assuming you have a similar API endpoint for fetching task form data
		await API.getTasks({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchTaskFormData();
	}, [resourceSlug]);

	if (tasks == null) {
		return 'Loading...'; //TODO: Implement a better loading indicator
	}

	return (
		<>
			<Head>
				<title>{`New Task - ${teamName}`}</title>
			</Head>

			{/* Adjusted to pass relevant props to TaskForm */}
			<TaskForm tools={tools} fetchTaskFormData={fetchTaskFormData} />
		</>
	);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
// Ensure the server-side props fetch necessary data for tasks if needed
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
