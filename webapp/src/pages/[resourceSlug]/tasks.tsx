import { PlusIcon } from '@heroicons/react/20/solid';
import NewButtonSection from 'components/NewButtonSection';
import TaskCards from 'components/TaskCards';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Blockies from 'react-blockies';

import * as API from '../../api';
import { useAccountContext } from '../../context/account';

export default function Tasks(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [open, setOpen] = useState(false);
	const { tasks } = state;

	async function fetchTasks() {
		await API.getTasks({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchTasks();
	}, [resourceSlug]);

	if (!tasks) {
		return 'Loading...'; //TODO: Implement a better loading state
	}

	return (
		<>
			<Head>
				<title>{`Tasks - ${teamName}`}</title>
				
			</Head>

			{tasks.length > 0 && <div className='border-b pb-2 my-2 dark:border-slate-600 flex justify-between'>
				<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>Tasks</h3>
				{tasks.length > 0 && <Link href={`/${resourceSlug}/task/add`}>
					<button
						type='button'
						className='inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
					>
						<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />
						Add Task
					</button>
				</Link>}
			</div>}

			<TaskCards tasks={tasks} />

			{tasks.length === 0 && <NewButtonSection
				link={`/${resourceSlug}/task/add`}
				emptyMessage={'No tasks'}
				icon={<svg
					className='mx-auto h-12 w-12 text-gray-400'
					fill='none'
					viewBox='0 0 24 24'
					stroke='currentColor'
					aria-hidden='true'
				>
					{/* Task-related SVG icon */}
					<path strokeLinecap='round' strokeLinejoin='round' d='M12 9v3m0 0v3m0-3h3m-3 0H9m6-6a9 9 0 11-18 0 9 9 0 0118 0z' />
				</svg>}
				message={'Get started by adding tasks.'}
				buttonIcon={<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />}
				buttonMessage={'Add Task'}
			/>}

		</>
	);
};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};
