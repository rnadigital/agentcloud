import * as API from '@api';
import { Dialog, Transition } from '@headlessui/react';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';

import VectorDbForm from './VectorDbForm';

export default function CreateVectorDbModal({ open, setOpen, callback }) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState({});
	const [error, setError] = useState();

	async function fetchVectorDBFormData() {
		await API.getVectorDbs({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchVectorDBFormData();
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

				<div className='fixed inset-0 z-10 overflow-y-auto'>
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
							<Dialog.Panel className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:p-6 md:min-w-[400px] dark:bg-slate-800 dark:text-gray-50'>
								<div>
									<div>
										<Dialog.Title
											as='h3'
											className='mb-4 border-b pb-4 text-base font-semibold leading-6 text-gray-900 dark:text-gray-50'
										>
											Create a Vector DB
										</Dialog.Title>
									</div>
								</div>
								<VectorDbForm
									// compact={true}
									callback={callback}
									fetchVectorDbFormData={fetchVectorDBFormData}
								/>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
}
