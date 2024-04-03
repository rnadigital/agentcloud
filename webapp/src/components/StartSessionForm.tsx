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
import SelectClassNames, { SelectClassNamesInverted } from '../lib/styles/SelectClassNames';

export default function StartSessionForm({ agents = [], crews = [], setOpen, fetchSessions, inverted = false }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const { stripeCustomerId } = account?.stripe || {};
	const [error, setError] = useState();
	const [promptValue, setPromptValue] = useState('');
	const [selected, setSelected] = useState(null);
	const [addedId, setAddedId] = useState(null);
	const [modalOpen, setModalOpen]: any = useState(false);

	async function addSession(e) {
		e.preventDefault();
		if (!selected?.value && !selected?.value) {
			toast.error('Please select an agent or crew from the dropdown');
			return null;
		}
		const target = e.target.form ? e.target.form : e.target;
		await API.addSession({
			_csrf: target._csrf.value,
			resourceSlug,
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
		}));/*.concat([{
			label: '+ New app',
			value: null,
			crew: true,
		} as any]);*/

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

		<div className='flex flex-row justify-start'>
			<div className='flex items-start space-x-4 w-full'>
				<div className='min-w-0 flex-1'>
					<form action='/forms/session/add' onSubmit={addSession}>
						<input type='hidden' name='_csrf' value={csrf} />
						<div className='flex flex-row space-x-3'>
							<Select
								isSearchable={crewOptions.length > 5}
								isClearable
								primaryColor={'indigo'}
								value={selected}
								classNames={inverted ? SelectClassNamesInverted : SelectClassNames}
								onChange={(e: any) => {
									if (e?.value === null) {
										return setModalOpen(e.crew ? 'crew' : 'single');
									}
									setSelected(e);
								}}
								options={[/*{
									label: 'Single Agent',
									options: agentOptions,
									}, */{
										label: 'Apps',
										options: crewOptions,
									},
								]}
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
											{data.options.length}
										</span>
									</div>
								)}
							/>
							
							<div className='transition-all pointer-events-none h-[36px]'>
								<div className='flex-shrink-0'>
									<button
										type='submit'
										className='h-[37px] pointer-events-auto inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm bg-indigo-600 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
									>
										<PaperAirplaneIcon className='h-4 w-4' />
									</button>
								</div>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>

	</div>);
}
