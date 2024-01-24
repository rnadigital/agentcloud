import {
	PaperAirplaneIcon,
} from '@heroicons/react/20/solid';
import React, { useState } from 'react';
import Blockies from 'react-blockies';

import { useAccountContext } from '../context/account';
import handleShiftNewlines from '../lib/misc/handleshiftnewlines';
import classNames from './ClassNames';

export default function SessionChatbox({ lastMessageFeedback, chatBusyState, onSubmit, scrollToBottom }) { //TODO: just get scrolltobottom from chatcontext

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;

	const [promptValue, setPromptValue] = useState('');

	return <form action='/forms/session/add' className='relative' onSubmit={e => onSubmit(e, () => setPromptValue(''))}>
		<input type='hidden' name='_csrf' value={csrf} />
		<input type='hidden' name='type' value='generate_team' />
		<label className='flex overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600 dark:bg-slate-800 dark:ring-slate-600'>
			<div className='block w-full min-h-20'>
				<textarea
					onKeyDown={e => handleShiftNewlines(e, promptValue, onSubmit, setPromptValue, scrollToBottom, chatBusyState)}
					rows={Math.min(10, promptValue.split(/\r?\n/).length)}
					name='prompt'
					id='prompt'
					className='noscrollbar block min-h-20 w-full h-full resize-none border-0 bg-transparent py-1.5 text-gray-900 focus:ring-0 placeholder:text-gray-400 sm:text-sm sm:leading-6 dark:text-white'
					placeholder={lastMessageFeedback ? 'Provide feedback...' : 'Type a message...'}
					value={promptValue}
					onChange={(e) => setPromptValue(e.target.value)}
				/>
			</div>
			{/* Spacer element to match the height of the toolbar */}
			<div className='py-2 w-20' aria-hidden='true'>
				{/* Matches height of button in toolbar (1px border + 36px content height) */}
				<div className='py-px'>
					<div className='h-9' />
				</div>
			</div>
		</label>

		<div className='pointer-events-none absolute inset-x-0 bottom-0 flex justify-end py-2 pl-2 pr-2'>
			{/*<div className='flex items-center space-x-5'>
				<div className='flex items-center'>
					<button
						type='button'
						className='-m-2.5 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-500'
					>
						<PaperClipIcon className='h-5 w-5' aria-hidden='true' />
						<span className='sr-only'>Attach a file</span>
					</button>
				</div>
			</div>*/}
			<div className='flex-shrink-0'>
				<button
					disabled={chatBusyState || promptValue.trim().length === 0}
					type='submit'
					className={classNames('pointer-events-auto inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm',
						!chatBusyState
							? 'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
							: 'bg-indigo-400 cursor-wait')}
				>
					<PaperAirplaneIcon className='h-4 w-4' />
				</button>
			</div>
		</div>
	</form>;
}
