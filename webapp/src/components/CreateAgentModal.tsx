import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import * as API from '../api';
import { useAccountContext } from '../context/account';
import AgentForm from './AgentForm';
import { useRouter } from 'next/router';

export default function CreateAgentModal({ open, setOpen, callback }) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState({});
	const [error, setError] = useState();
	const { agents, credentials, tools, datasources } = state as any;

	async function fetchAgentFormData() {
		await API.getAgents({ resourceSlug }, dispatch, setError, router);
	}
	
	useEffect(() => {
		fetchAgentFormData();
	}, []);
	
	return (
		<Transition.Root show={open} as={Fragment}>
			<Dialog as='div' className='relative z-50' onClose={setOpen}>
				<Transition.Child
					as={Fragment}
					enter='ease-out duration-300'
					enterFrom='opacity-0'
					enterTo='opacity-100'
					leave='ease-in duration-200'
					leaveFrom='opacity-100'
					leaveTo='opacity-0'
				>
					<div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
				</Transition.Child>

				<div className='lg:ms-[144px] fixed inset-0 z-10 w-screen overflow-y-auto'>
					<div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
						<Transition.Child
							as={Fragment}
							enter='ease-out duration-300'
							enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
							enterTo='opacity-100 translate-y-0 sm:scale-100'
							leave='ease-in duration-200'
							leaveFrom='opacity-100 translate-y-0 sm:scale-100'
							leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
						>
							<Dialog.Panel className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:p-6 overflow-visible'>
								<div>
									<div className=''>
										<Dialog.Title as='h3' className='mb-4 border-b pb-4 text-base font-semibold leading-6 text-gray-900'>
											Create an agent
										</Dialog.Title>
									</div>
								</div>
								<AgentForm datasources={datasources} credentials={credentials} tools={tools} compact={true} callback={callback} fetchAgentFormData={fetchAgentFormData} />
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
}
