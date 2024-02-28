import {
	PaperAirplaneIcon,
} from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';

import * as API from '../api';
// import CreateAgentModal from '../components/CreateAgentModal';
// import CreateCrewModal from '../components/CreateCrewModal';
import { useAccountContext } from '../context/account';
import handleShiftNewlines from '../lib/misc/handleshiftnewlines';
import SelectClassNames from '../lib/styles/SelectClassNames';

export default function StartSessionForm({ agents = [], crews = [], setOpen, fetchSessions }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const { stripeCustomerId } = account?.stripe || {};
	const [error, setError] = useState();
	const [promptValue, setPromptValue] = useState('');
	const [sessionType, setSessionType] = useState('single');
	const [selected, setSelected] = useState(null);
	const [addedId, setAddedId] = useState(null);
	const [modalOpen, setModalOpen]: any = useState(false);

	async function addSession(e) {
		e.preventDefault();
		if (setOpen && !stripeCustomerId && !process.env.NEXT_PUBLIC_NO_PAYMENT_REQUIRED) {
			setOpen(true);
			return null;
		}
		if (!selected?.value && !selected?.value) {
			toast.error('Please select an agent or crew from the dropdown');
			return null;
		}
		const target = e.target.form ? e.target.form : e.target;
		await API.addSession({
			_csrf: target._csrf.value,
			resourceSlug,
			prompt: target.prompt.value,
			id: selected?.value,
		}, null, setError, router);
	}

	async function callback(id: string) {
		setAddedId(id);
		await fetchSessions();
	}

	//When agents or crews change set the selected crew from the callback
	useEffect(() => {
		if (!addedId) { return; }
		const foundAgent = agents.find(a => a._id === addedId);
		foundAgent && setSelected({ label: foundAgent.name, value: foundAgent._id, tools: foundAgent.toolIds?.length > 0, rag: foundAgent.datasourceIds?.length > 0 });
		const foundCrew = crews.find(g => g._id === addedId);
		foundCrew && setSelected({ label: foundCrew.name, value: foundCrew._id });
		setAddedId(null);
		setModalOpen(false);
	}, [agents, crews]);

	const crewOptions: any[] = crews
		.map(g => ({
			label: g.name,
			value: g._id,
			//TODO: rag true/false capability
		})).concat([{
			label: '+ New crew',
			value: null,
			crew: true,
		} as any]);

	const agentOptions: any[] = agents
		.map(a => ({
			label: a.name,
			value: a._id,
			rag: a.datasourceIds?.length > 0,
			tools: a.toolIds?.length > 0,
		} as any)).concat([{
			label: '+ New agent',
			value: null,
			crew: false,
		} as any]);

	return (<div className='flex flex-col'>

		{/*modalOpen === 'crew'
			? <CreateCrewModal open={modalOpen !== false} setOpen={setModalOpen} callback={callback} />
			: <CreateAgentModal open={modalOpen !== false} setOpen={setModalOpen} callback={callback} />*/}

		<div className='flex flex-row justify-center'>
			<div className='flex items-start space-x-4 w-full'>
				<div className='min-w-0 flex-1'>
					<form action='/forms/session/add' className='relative' onSubmit={addSession}>
						<input type='hidden' name='_csrf' value={csrf} />
						<Select
							isSearchable={crewOptions.length > 5}
							isClearable
							primaryColor={'indigo'}
							value={selected}
							classNames={SelectClassNames}
							onChange={(e: any) => {
								if (e?.value === null) {
									return setModalOpen(e.crew ? 'crew' : 'single');
								}
								setSelected(e);
							}}
							options={[{
								label: 'Single Agent',
								options: agentOptions,
							}, {
								label: 'Crew',
								options: crewOptions,
							}]}
							formatOptionLabel={(data: any) => (
				                <li
				                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-${data.isSelected?'500 text-white':'100'} ${data.isSelected?'bg-blue-500':''}`}
				                >
				                    {data.label}
				                    {data.rag && <span className='inline-flex items-center rounded-md bg-green-100 mx-1 px-2 py-1 text-xs font-semibold text-green-700'>
										ʀᴀɢ
									</span>}
				                    {data.tools && <span className='inline-flex items-center rounded-md bg-yellow-100 mx-1 px-2 py-1 text-xs font-semibold text-yellow-700'>
										ᴛᴏᴏʟs
									</span>}
				                </li>
				            )}
							formatGroupLabel={data => (
								<div className='py-2 text-xs flex items-center justify-between'>
									<span className='font-bold'>{data.label}</span>
									<span className='bg-gray-200 h-5 h-5 p-1.5 flex items-center justify-center rounded-ful'>
										{data.options.length-1}
									</span>
								</div>
							)}
						/>
						<label className='transition-all bg-white dark:bg-slate-800 mt-2 flex overflow-hidden rounded shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-600 focus-within:ring-2 focus-within:ring-indigo-600'>
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
