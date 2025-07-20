import * as API from '@api';
import { Dialog, Transition } from '@headlessui/react';
import InviteForm from 'components/InviteForm';
// import { useAccountContext } from 'context/account';
// import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';

export default function InviteFormModal({ open, setOpen, callback }) {
	// const [accountContext]: any = useAccountContext();
	// const { account, csrf } = accountContext as any;
	// const router = useRouter();
	// const { resourceSlug } = router.query;
	// const [error, setError] = useState();
	// const [state, setState] = useState({});
	// async function fetchInviteFormData() {
	// 	await API.getInviteFormData({ resourceSlug }, setState, setError, router);
	// }
	// useEffect(() => {
	// 	fetchInviteFormData();
	// }, []);

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
					<div className='fixed inset-0 backdrop-blur-sm bg-transparent transition-opacity' />
				</Transition.Child>

				<div className='fixed inset-0 flex items-center justify-center z-10 overflow-y-auto'>
					{/* lg:ms-[144px] */}
					<Transition.Child
						as={Fragment}
						enter='ease-out duration-300'
						enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
						enterTo='opacity-100 translate-y-0 sm:scale-100'
						leave='ease-in duration-200'
						leaveFrom='opacity-100 translate-y-0 sm:scale-100'
						leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
					>
						<Dialog.Panel className='absolute left-auto transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:p-6 md:min-w-[400px] dark:bg-slate-800 dark:text-gray-50 w-full max-w-xl'>
							<div>
								<div className=''>
									<Dialog.Title
										as='h3'
										className='mb-4 border-b pb-4 font-semibold text-xl leading-6 text-gray-900 dark:text-gray-50'
									>
										Invite Team Member
									</Dialog.Title>
								</div>
							</div>
							<InviteForm
								callback={callback}
								setOpen={setOpen}
								// fetchInviteFormData={fetchInviteFormData}
							/>
						</Dialog.Panel>
					</Transition.Child>
				</div>
			</Dialog>
		</Transition.Root>
	);
}
