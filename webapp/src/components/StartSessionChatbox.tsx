import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import handleShiftNewlines from '../lib/misc/handleshiftnewlines';
import { useAccountContext } from '../context/account';
import Select from 'react-tailwindcss-select';
import {
	PaperAirplaneIcon,
} from '@heroicons/react/20/solid';
import * as API from '../api';
import SelectClassNames from '../lib/styles/SelectClassNames';
import CreateAgentModal from '../components/CreateAgentModal';
import CreateGroupModal from '../components/CreateGroupModal';
import { toast } from 'react-toastify';

const sessionRadios = [
	{ name: 'single', title: 'Single Agent' },
	{ name: 'rag', title: 'Single Agent', badge: <span className='inline-flex items-center rounded-md bg-green-100 mx-1 px-2 py-1 text-xs font-medium text-green-700'>
		+ RAG
	</span> },
	{ name: 'multi', title: 'Multi Agent', badge: <span className='inline-flex items-center rounded-md bg-blue-100 mx-1 px-2 py-1 text-xs font-medium text-blue-700'>
		BETA
	</span> },
];

export default function StartSessionChatbox({ agents = [], groups = [], setOpen, fetchSessions }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const { stripeCustomerId } = account;
	const [error, setError] = useState();
	const [promptValue, setPromptValue] = useState('');
	const [sessionRadio, setSessionRadio] = useState('single');
	const [selectedGroup, setSelectedGroup] = useState(null);
	const [selectedAgent, setSelectedAgent] = useState(null);
	const [addedId, setAddedId] = useState(null);
	const [modalOpen, setModalOpen] = useState(false);

	async function addSession(e) {
		e.preventDefault();
		if (!stripeCustomerId && !process.env.NEXT_PUBLIC_NO_PAYMENT_REQUIRED) {
			setOpen(true);
			return null;
		}
		if (!selectedGroup?.value && !selectedAgent?.value) {
			toast.error(`Please select ${sessionRadio === 'multi' ? 'a group' : 'an agent'} from the dropdown`);
			return null;
		}
		const target = e.target.form ? e.target.form : e.target;
		await API.addSession({
			_csrf: target._csrf.value,
			resourceSlug,
			prompt: target.prompt.value,
			group: selectedGroup?.value,
			agent: selectedAgent?.value,
			rag: sessionRadio === 'rag',
		}, null, setError, router);
	}

	async function callback(id: string) {
		setAddedId(id);
		await fetchSessions();
	}

	//When agents or groups change set the selected group from the callback
	useEffect(() => {
		if (!addedId) { return; }
		if (sessionRadio === 'single') {
			const foundAgent = agents.find(a => a._id === addedId);
			foundAgent && setSelectedAgent({ label: foundAgent.name, value: foundAgent._id });
		} else {
			const foundGroup = groups.find(g => g._id === addedId);
			foundGroup && setSelectedGroup({ label: foundGroup.name, value: foundGroup._id });
		}
		setAddedId(null);
		setModalOpen(false);
	}, [agents, groups]);

	const groupOptions = groups
		.filter(g => {
			return g.adminAgent && g.agents.length > 0;
		}).map(g => ({
			label: g.name,
			value: g._id,
		}));

	const ragAgentOptions = agents
		.filter(a => a?.datasourceIds?.length > 0)
		.map(a => ({
			label: a.name,
			value: a._id,
		}));
	const agentOptions = agents
		.map(a => ({
			label: a.name,
			value: a._id,
		}));

	return (<div className='flex flex-col mb-10'>

		<div className='text-center my-3 dark:text-white'>
			Start a new chat session:
		</div>

		{sessionRadio !== 'multi'
			? <CreateAgentModal open={modalOpen} setOpen={setModalOpen} callback={callback} />
			: <CreateGroupModal open={modalOpen} setOpen={setModalOpen} callback={callback} />}

		<div className='flex flex-row justify-center'>
			<div className='flex items-start space-x-4 basis-1/2'>
				<div className='min-w-0 flex-1'>
					<form action='/forms/session/add' className='relative' onSubmit={addSession}>
						<div>
							<p className='text-sm'>Select your session type:</p>
							<fieldset className='my-3'>
								<legend className='sr-only'>Notification method</legend>
								<div className='space-y-4'>
									{sessionRadios.map((r) => (
										<div key={r.name} className='flex items-center'>
											<input
												id={r.name}
												name='notification-method'
												type='radio'
												onChange={(e) => setSessionRadio(e.target.id)}
												defaultChecked={r.name === sessionRadio}
												className='h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600'
											/>
											<label htmlFor={r.name} className='ml-3 block text-sm font-medium leading-6 text-gray-900'>
												{r.title} {r.badge}
											</label>
										</div>
									))}
								</div>
							</fieldset>
						</div>
						<input type='hidden' name='_csrf' value={csrf} />
						{sessionRadio === 'multi'
							? <Select
								isSearchable={groupOptions.length > 5}
								isClearable
								primaryColor={'indigo'}
								value={selectedGroup}
								classNames={SelectClassNames}
								onChange={(e: any) => {
									if (e?.value === null) {
										//Create new pressed
										return setModalOpen(true);
									}
									setSelectedGroup(e);
								}}
								options={groupOptions.concat([{ label: '+ Create new group', value: null }])}
							/>
							: <Select
								isSearchable={agentOptions.length > 5}
								isClearable
								primaryColor={'indigo'}
								value={selectedAgent}
								classNames={SelectClassNames}
								onChange={(e: any) => {
									if (e?.value === null) {
										//Create new pressed
										return setModalOpen(true);
									}
									setSelectedAgent(e);
								}}
								options={(sessionRadio === 'rag' ? ragAgentOptions : agentOptions).concat([{ label: '+ Create new agent', value: null }])}
							/>}
						<label className='transition-all bg-white dark:bg-slate-800 mt-2 flex overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-600 focus-within:ring-2 focus-within:ring-indigo-600'>
							<div className='block w-full min-h-20'>
								<textarea
									onKeyDown={e => handleShiftNewlines(e, promptValue, addSession, setPromptValue)}
									rows={Math.min(10, promptValue.split(/\r?\n/).length)}
									name='prompt'
									id='prompt'
									className='noscrollbar block min-h-20 w-full h-full resize-none border-0 bg-transparent py-1.5 text-gray-900 focus:ring-0 placeholder:text-gray-400 sm:text-sm sm:leading-6 dark:text-white'
									placeholder={'Describe a task...'}
									value={promptValue}
									onChange={(e) => setPromptValue(e.target.value)}
								/>
							</div>
							{/* Spacer element to match the height of the toolbar */}
							<div className='py-2 w-10' aria-hidden='true'>
								{/* Matches height of button in toolbar (1px border + 36px content height) */}
								<div className='py-px'>
									<div className='h-9' />
								</div>
							</div>
						</label>
						<div className='transition-all pointer-events-none absolute inset-x-0 bottom-0 flex justify-end py-2 pl-2 pr-2'>
							<div className='flex-shrink-0'>
								<button
									type='submit'
									className='pointer-events-auto inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm bg-indigo-600 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
								>
									<PaperAirplaneIcon className='h-4 w-4' />
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>

	</div>);
}
