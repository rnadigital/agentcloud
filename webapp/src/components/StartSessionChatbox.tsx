import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAccountContext } from '../context/account';
import {
  // PaperClipIcon,
	PlusIcon,
} from '@heroicons/react/20/solid';
import * as API from '../api';

export default function StartSessionChatbox() {

	const [accountContext] = useAccountContext();
	const { account, csrf } = accountContext as any;
	const resourceSlug = account.currentTeam;

	const router = useRouter();
	const [error, setError] = useState();

	async function addSession(e) {
		e.preventDefault();
		await API.addSession({
			_csrf: e.target._csrf.value,
			prompt: e.target.prompt.value,
			type: e.target.type.value,
		}, null, setError, router);
	}

	return (<div className='flex flex-col my-24'>

		<div className='text-center my-2'>
			<span className='me-2 inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20'>
				New!
			</span>
			To start a new session, describe a task in natural language:
		</div>

		<div className='flex flex-row justify-center'>
			<div className='flex items-start space-x-4 basis-1/2'>
				<div className='flex-shrink-0  ring-1 rounded-full ring-gray-300'>
					<span
						className='inline-block h-10 w-10 text-center pt-2 font-bold'
					>
						{account.name.charAt(0).toUpperCase()}
					</span>
				</div>
				<div className='min-w-0 flex-1'>
					<form action='/forms/session/add' className='relative' onSubmit={addSession}>
						<input type='hidden' name='_csrf' value={csrf} />
						<input type='hidden' name='type' value='generate_team' />
						<div className='overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600'>
							<textarea
								rows={3}
								name='prompt'
								id='prompt'
								className='block w-full resize-none border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6'
								placeholder={'Something to do...'}
								defaultValue={''}
							/>

							{/* Spacer element to match the height of the toolbar */}
							<div className='py-2' aria-hidden='true'>
								{/* Matches height of button in toolbar (1px border + 36px content height) */}
								<div className='py-px'>
									<div className='h-9' />
								</div>
							</div>
						</div>

						<div className='absolute inset-x-0 bottom-0 flex justify-end py-2 pl-2 pr-2'>
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
									type='submit'
									className='inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
								>
									Start Session
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>

		<div className='flex flex-row justify-center mt-10 mb-2'>
			<div className='basis-1/2'>
				<div className='relative'>
			      <div className='absolute inset-0 flex items-center' aria-hidden='true'>
			        <div className='w-full border-t border-gray-300' />
			      </div>
			      <div className='relative flex justify-center'>
			        <span className='bg-white px-2 text-sm text-gray-500'>OR</span>
			      </div>
			    </div>
			</div>
		</div>

		<div className='flex flex-row justify-center'>
			<Link href={`/${resourceSlug}/agent/add`}>
				<button
					type='button'
					className='mt-6 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
				>
					<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />
					Create Session Manually
				</button>
			</Link>
		</div>

	</div>);
}
