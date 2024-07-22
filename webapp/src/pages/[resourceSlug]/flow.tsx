import * as API from '@api';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { FlowWithProvider } from 'components/Flow';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { useStepContext } from 'context/stepwrapper';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function FlowPage(props) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { step, setStep }: any = useStepContext();
	const { apps, tools, agents, tasks, models, datasources } = state;

	const [expandSections, setExpandSections] = useState({
		agents: false,
		tools: false,
		tasks: false,
		datasources: false
	});

	const toggleSection = section => {
		setExpandSections(prevState => ({
			...prevState,
			[section]: !prevState[section]
		}));
	};

	const onDragStart = (event, nodeType, dataObject) => {
		event.dataTransfer.setData('application/reactflow', nodeType);
		event.dataTransfer.setData('data', JSON.stringify(dataObject));
		event.dataTransfer.effectAllowed = 'move';
	};

	async function fetchAppFormData() {
		await API.getApps({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchAppFormData();
	}, [resourceSlug]);

	if (apps == null) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>Flow Test</title>
			</Head>
			<div className='flex h-screen'>
				<div className='w-64 bg-gray-800 text-white flex-shrink-0'>
					<div className='p-4'>
						<h2 className='text-xl font-bold'>Sidebar</h2>
						<div className='mt-4'>
							<div>
								<button
									className='flex items-center justify-between w-full text-left p-2 hover:bg-gray-700'
									onClick={() => toggleSection('agents')}
								>
									<span>Agents</span>
									{expandSections.agents ? (
										<ChevronDownIcon className='w-5 h-5' />
									) : (
										<ChevronRightIcon className='w-5 h-5' />
									)}
								</button>
								{expandSections.agents && (
									<div className='pl-4'>
										<ul>
											{agents.map(agent => (
												<li
													key={agent._id}
													draggable
													onDragStart={event => onDragStart(event, 'agent', agent)}
													className='cursor-pointer'
												>
													{agent.name}
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
							<div>
								<button
									className='flex items-center justify-between w-full text-left p-2 hover:bg-gray-700'
									onClick={() => toggleSection('tools')}
								>
									<span>Tools</span>
									{expandSections.tools ? (
										<ChevronDownIcon className='w-5 h-5' />
									) : (
										<ChevronRightIcon className='w-5 h-5' />
									)}
								</button>
								{expandSections.tools && (
									<div className='pl-4'>
										<ul>
											{tools.map(tool => (
												<li
													key={tool._id}
													draggable
													onDragStart={event => onDragStart(event, 'tool', tool)}
													className='cursor-pointer'
												>
													{tool.name}
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
							<div>
								<button
									className='flex items-center justify-between w-full text-left p-2 hover:bg-gray-700'
									onClick={() => toggleSection('tasks')}
								>
									<span>Tasks</span>
									{expandSections.tasks ? (
										<ChevronDownIcon className='w-5 h-5' />
									) : (
										<ChevronRightIcon className='w-5 h-5' />
									)}
								</button>
								{expandSections.tasks && (
									<div className='pl-4'>
										<ul>
											{tasks.map(task => (
												<li
													key={task._id}
													draggable
													onDragStart={event => onDragStart(event, 'task', task)}
													className='cursor-pointer'
												>
													{task.name}
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
							<div>
								<button
									className='flex items-center justify-between w-full text-left p-2 hover:bg-gray-700'
									onClick={() => toggleSection('datasources')}
								>
									<span>Datasources</span>
									{expandSections.datasources ? (
										<ChevronDownIcon className='w-5 h-5' />
									) : (
										<ChevronRightIcon className='w-5 h-5' />
									)}
								</button>
								{expandSections.datasources && (
									<div className='pl-4'>
										<ul>
											{datasources.map(datasource => (
												<li
													key={datasource._id}
													draggable
													onDragStart={event => onDragStart(event, 'datasource', datasource)}
													className='cursor-pointer'
												>
													{datasource.name}
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
				<div className='flex-grow'>
					<FlowWithProvider />
				</div>
			</div>
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
