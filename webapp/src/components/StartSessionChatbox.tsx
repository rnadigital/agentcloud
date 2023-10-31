import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import handleShiftNewlines from '../lib/misc/handleshiftnewlines';
import { useAccountContext } from '../context/account';
import Select from "react-tailwindcss-select";
import {
  // PaperClipIcon,
	PlusIcon,
} from '@heroicons/react/20/solid';
import * as API from '../api';

export default function StartSessionChatbox() {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const resourceSlug = account.currentTeam;

	const router = useRouter();
	const [error, setError] = useState();
	const [promptValue, setPromptValue] = useState('');

	const [selectedTeam, setSelectedTeam] = useState('Auto-generate team');

	async function addSession(e) {
		e.preventDefault();
		const target = e.target.form ? e.target.form : e.target;
		await API.addSession({
			_csrf: target._csrf.value,
			prompt: target.prompt.value,
			type: target.type.value,
		}, null, setError, router);
	}

	return (<div className='flex flex-col mb-10'>

		<div className='text-center my-2'>
			To start a new session, describe a task in natural language:
		</div>

		<div className='flex flex-row justify-center'>
			<div className='flex items-start space-x-4 basis-1/2'>
				<div className='min-w-0 flex-1'>
					<form action='/forms/session/add' className='relative' onSubmit={addSession}>
						<input type='hidden' name='_csrf' value={csrf} />
						<input type='hidden' name='type' value='generate_team' />
						
				        <Select
				            primaryColor={"indigo"}
				            value={selectedTeam}
				            onChange={setSelectedTeam}
				            formatOptionLabel={data => (
				                <li
				                    className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded ${
				                        !data.isSelected
				                            ? `text-white bg-blue-500`
				                            : `bg-blue-100 text-blue-500`
				                    }`}
				                >
				                    {data.label}
				                </li>
				            )}
				            options={['Auto-generate team', 'Team A', 'Team B', '+ Create new team'].map(x => ({label:x,value:x}))}
				        />
						<label className='flex overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600'>
							<div className='block w-full min-h-20'>
								<textarea
									onKeyDown={e => handleShiftNewlines(e, promptValue, addSession, setPromptValue)}
									rows={Math.min(10, promptValue.split(/\r?\n/).length)}
									name='prompt'
									id='prompt'
									className='noscrollbar block min-h-20 w-full h-full resize-none border-0 bg-transparent py-1.5 text-gray-900 focus:ring-0 placeholder:text-gray-400 sm:text-sm sm:leading-6'
									placeholder={'Describe a task...'}
									defaultValue={''}
									value={promptValue}
									onChange={(e) => setPromptValue(e.target.value)}
								/>
							</div>
							{/* Spacer element to match the height of the toolbar */}
							<div className='py-2 w-32' aria-hidden='true'>
								{/* Matches height of button in toolbar (1px border + 36px content height) */}
								<div className='py-px'>
									<div className='h-9' />
								</div>
							</div>
						</label>
						<div className='pointer-events-none absolute inset-x-0 bottom-0 flex justify-end py-2 pl-2 pr-2'>
							<div className='flex-shrink-0'>
								<button
									type='submit'
									className='pointer-events-auto inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm bg-indigo-600 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
								>
									Start Session
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>

	</div>);
}
