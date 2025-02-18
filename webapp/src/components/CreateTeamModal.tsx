import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useRouter } from 'next/router';
import { Fragment } from 'react';

import TeamForm from './TeamForm';

export default function CreateTeamModal({ open, setOpen, callback }) {
	const router = useRouter();

	return (
		<Transition show={open} as={Fragment}>
			<Dialog as='div' className='relative z-50' onClose={setOpen}>
				<TransitionChild
					as={Fragment}
					enter='ease-out duration-300'
					enterFrom='opacity-0'
					enterTo='opacity-100'
					leave='ease-in duration-200'
					leaveFrom='opacity-100'
					leaveTo='opacity-0'>
					<div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
				</TransitionChild>

				<div className='lg:ms-[144px] fixed inset-0 z-10 w-screen overflow-y-auto'>
					<div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
						<TransitionChild
							as={Fragment}
							enter='ease-out duration-300'
							enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
							enterTo='opacity-100 translate-y-0 sm:scale-100'
							leave='ease-in duration-200'
							leaveFrom='opacity-100 translate-y-0 sm:scale-100'
							leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'>
							<DialogPanel className='relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:p-6 overflow-visible md:min-w-[400px] dark:bg-slate-800 dark:text-white'>
								<div>
									<div className=''>
										<DialogTitle
											as='h3'
											className='mb-4 border-b pb-4 text-base font-semibold leading-6 text-gray-900 dark:text-white'>
											New Team
										</DialogTitle>
									</div>
								</div>
								<TeamForm callback={callback} />
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
