import React, { useState } from 'react';
import { useAccountContext } from '../context/account';
import classNames from './ClassNames';

export default function SessionChatbox({ chatBusyState, onSubmit }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;

	const [promptValue, setPromptValue] = useState('');

	function handleKeyDown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (chatBusyState) { return; }
			if (promptValue.trim().length > 0) {
				onSubmit(e);		
				setPromptValue('');
			}
		}
	}

	return <form action='/forms/session/add' className='relative' onSubmit={onSubmit}>
		<input type='hidden' name='_csrf' value={csrf} />
		<input type='hidden' name='type' value='generate_team' />
		<div className='flex overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600'>
			<textarea
				onKeyDown={handleKeyDown}
				rows={Math.min(5, promptValue.split(/\r?\n/).length)}
				name='prompt'
				id='prompt'
				className='block w-full resize-none border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6'
				placeholder={'Type a message...'}
				defaultValue={''}
				value={promptValue}
				onChange={(e) => setPromptValue(e.target.value)}
			/>

			{/* Spacer element to match the height of the toolbar */}
			<div className='py-2' aria-hidden='true'>
				{/* Matches height of button in toolbar (1px border + 36px content height) */}
				<div className='py-px'>
					<div className='h-9' />
				</div>
			</div>
		</div>

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
					className={classNames('inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm',
						!chatBusyState
							? 'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
							: 'bg-indigo-400 cursor-wait')}
				>
					Send
				</button>
			</div>
		</div>
	</form>;
}
