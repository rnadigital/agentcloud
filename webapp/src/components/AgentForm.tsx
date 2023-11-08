'use strict';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAccountContext } from '../context/account';
import { useRouter } from 'next/router';
import * as API from '../api';
import { toast } from 'react-toastify';

export default function AgentForm({ agent = {}, editing }: { agent?: any, editing?: boolean }) { //TODO: fix any type

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const resourceSlug = account?.currentTeam;

	const router = useRouter();
	const [agentState, setAgent] = useState(agent);
	const [error, setError] = useState();
	const { verifysuccess } = router.query;

	const { _id, name, llmConfig, type, systemMessage, codeExecutionConfig, isUserProxy } = agentState;

	async function agentPost(e) {
		e.preventDefault();
		const body = {
			_csrf: e.target._csrf.value,
			name: e.target.name.value,
			type: e.target.type.value,
			llmConfigType: e.target.llmConfigType.value,
			systemMessage: e.target.systemMessage.value,
		};
		if (editing) {			
			await API.editAgent(agentState._id, body, () => {
				toast.success('Agent Updated');
			}, setError, null);
		} else {
			API.addAgent(body, null, setError, router);
		}
	}

	return (<form onSubmit={agentPost}>
		<input
			type='hidden'
			name='_csrf'
			value={csrf}
		/>
		<div className='space-y-12'>

			<div className='grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3'>
				<div>
					<h2 className='text-base font-semibold leading-7 text-gray-900'>Agent Details</h2>
					<p className='mt-1 text-sm leading-6 text-gray-600'>Choose the name and model to use for this agent.</p>
				</div>

				<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>
					<div className='sm:col-span-12'>
						<label htmlFor='name' className='block text-sm font-medium leading-6 text-gray-900'>
								Agent Name
						</label>
						<div className='mt-2'>
							<input
								required
								type='text'
								name='name'
								id='name'
								defaultValue={name}
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
							/>
						</div>
					</div>

					<div className='sm:col-span-12'>
						<label htmlFor='model' className='block text-sm font-medium leading-6 text-gray-900'>
								Model
						</label>
						<div className='mt-2'>
							<select
								required
								id='model'
								name='llmConfigType'
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
							>
								<option disabled value=''>Select a model...</option>
								<option value='gpt-4-32k'>gpt-4-32k</option>
								<option value='gpt-4-32k-0314'>gpt-4-32k-0314</option>
							</select>
						</div>
					</div>

					<div className='sm:col-span-12'>
						<fieldset>
							<legend className='mb-2 text-sm font-semibold leading-6 text-gray-900'>Type</legend>
							<div className='space-y-6'>
								<div className='flex items-center gap-x-3'>
									<div className='flex h-6 items-center'>
										<input
											required
											id='executor-agent'
											name='type'
											type='radio'
											value='ExecutorAgent'
											className='h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600'
											defaultChecked={codeExecutionConfig != null}
										/>
									</div>
									<div className='text-sm leading-6'>
										<label htmlFor='executor-agent' className='block text-sm font-semibold leading-6 text-gray-900'>
						                    Executor Agent
											<p className='font-medium text-gray-500'>An agent that executes code.</p>
										</label>
									</div>
								</div>
								<div className='flex items-center gap-x-3'>
									<div className='flex h-6 items-center'>
										<input
											required
											id='user-proxy-agent'
											name='type'
											type='radio'
											value='UserProxyAgent'
											className='h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600'
											defaultChecked={isUserProxy}
										/>
									</div>
									<div className='text-sm leading-6'>
										<label htmlFor='user-proxy-agent' className='block text-sm font-semibold leading-6 text-gray-900'>
	                    					User Proxy Agent
											<p className='font-medium text-gray-500'>A proxy agent for the user, that can execute code and provide feedback to the other agents.</p>
										</label>
									</div>
								</div>
								<div className='flex items-center gap-x-3'>
									<div className='flex h-6 items-center'>
										<input
											id='assistant-agent'
											name='type'
											type='radio'
											value='AssistantAgent'
											className='h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600'
											defaultChecked={type === 'AssistantAgent'}
										/>
									</div>
									<div className='text-sm leading-6'>
										<label htmlFor='assistant-agent' className='block text-sm font-semibold leading-6 text-gray-900'>
						                    Assistant Agent
											<p className='font-medium text-gray-500'>Assistant agent, designed to solve a task with LLM.</p>
										</label>
									</div>
								</div>
							</div>
						</fieldset>
					</div>
				</div>

			</div>
			
			<div className='grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3'>
				<div>
					<h2 className='text-base font-semibold leading-7 text-gray-900'>Task Definition</h2>
					<p className='mt-1 text-sm leading-6 text-gray-600'>
							This is the task definition. You <strong>must</strong> specify the following:
					</p>
					<ol className='pl-5 list-disc mt-1 text-sm leading-6 text-gray-600'>
						<li>Skills - What skills this agent posesses.</li>
						<li>Task(s) - What inputs to take, what to do with them and what tools to use.</li>
						<li>Boundaries - Things the agent should not do, limits it should not exceed.</li>
						<li>Output - The output to be produced.</li>
					</ol>
				</div>

				<div className='grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2'>

					<div className='col-span-full'>
						<label htmlFor='definition' className='block text-sm font-medium leading-6 text-gray-900'>
								Definition
						</label>
						<div className='mt-2'>
							<textarea
								required
								id='definition'
								name='systemMessage'
								rows={8}
								className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
								defaultValue={systemMessage}
							/>
						</div>
						{/*<p className='mt-3 text-sm leading-6 text-gray-600'></p>*/}
					</div>
				</div>
			</div>

		</div>

		<div className='mt-6 flex items-center justify-end gap-x-6'>
			<Link
				className='text-sm font-semibold leading-6 text-gray-900'
				href={`/${resourceSlug}/agents`}
			>
				Back
			</Link>
			<button
				type='submit'
				className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
			>
					Save
			</button>
		</div>
	</form>);

}
