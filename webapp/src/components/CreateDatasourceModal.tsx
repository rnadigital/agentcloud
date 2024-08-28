import * as API from '@api';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import CreateDatasourceForm from 'components/CreateDatasourceForm'; // Assuming this component is similar to ModelForm but for datasources
import { useAccountContext } from 'context/account';
import FormContext from 'context/connectorform';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function CreateDatasourceModal({ open, setOpen, callback, initialStep }) {
	const [accountContext]: any = useAccountContext();
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState({});
	const { models } = state as any;
	const [forceClose, setForceClose] = useState(false);
	const [spec, setSpec] = useState(null);

	async function fetchDatasourceFormData() {
		await API.getModels({ resourceSlug }, dispatch, toast.error, router);
	}

	useEffect(() => {
		fetchDatasourceFormData();
	}, []);

	const handleOnClose = () => {
		if (!spec) {
			setOpen(false);
		} else {
			setForceClose(!forceClose);
		}
	};

	const closeConfirmModal = () => {
		setForceClose(false);
	};

	const onConfirmClose = () => {
		setOpen(!open);
		setForceClose(false);
		setSpec(null);
	};

	return (
		<>
			<Transition show={forceClose} as={Fragment}>
				<Dialog as='div' className='relative z-[100]' onClose={closeConfirmModal}>
					<TransitionChild
						as={Fragment}
						enter='ease-out duration-300'
						enterFrom='opacity-0'
						enterTo='opacity-100'
						leave='ease-in duration-200'
						leaveFrom='opacity-100'
						leaveTo='opacity-0'
					>
						<div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
					</TransitionChild>
					<div className='fixed inset-0 overflow-y-auto w-full'>
						<div className='flex min-h-full items-end justify-center p-3 text-center sm:items-center sm:p-0 w-full'>
							<TransitionChild
								as={Fragment}
								enter='ease-out duration-300'
								enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
								enterTo='opacity-100 translate-y-0 sm:scale-100'
								leave='ease-in duration-200'
								leaveFrom='opacity-100 translate-y-0 sm:scale-100'
								leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
							>
								<DialogPanel className='relative transform rounded-lg bg-white px-3 pb-2 pt-4 text-left shadow-xl transition-all sm:my-8 sm:p-6 m-10 dark:bg-slate-800 dark:text-gray-50'>
									<DialogTitle
										as='h3'
										className='text-lg font-medium text-gray-900 dark:text-white'
									>
										Are you sure you want to exit?
									</DialogTitle>
									<div className='flex flex-col'>
										<p className='py-4'>Closing now will result in losing all progress.</p>
										<div className='flex flex-row pt-2 gap-5 text-sm'>
											<button
												className='px-3 py-2 bg-rose-500 text-white font-bold rounded-lg shadow-sm hover:shadow-lg'
												onClick={onConfirmClose}
											>
												Yes, close
											</button>
											<button
												className='px-3 py-2 border rounded-lg shadow-sm hover:shadow-lg dark:bg-slate-800 dark:text-white'
												onClick={closeConfirmModal}
											>
												No, keep open
											</button>
										</div>
									</div>
								</DialogPanel>
							</TransitionChild>
						</div>
					</div>
				</Dialog>
			</Transition>
			<Transition show={open} as={Fragment}>
				<Dialog as='div' className='relative z-50' onClose={handleOnClose}>
					<TransitionChild
						as={Fragment}
						enter='ease-out duration-300'
						enterFrom='opacity-0'
						enterTo='opacity-100'
						leave='ease-in duration-200'
						leaveFrom='opacity-100'
						leaveTo='opacity-0'
					>
						<div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
					</TransitionChild>

					<div className='fixed inset-0 z-10 overflow-y-auto w-full'>
						<div className='flex min-h-full items-end justify-center p-3 text-center sm:items-center sm:p-0 w-full'>
							<TransitionChild
								as={Fragment}
								enter='ease-out duration-300'
								enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
								enterTo='opacity-100 translate-y-0 sm:scale-100'
								leave='ease-in duration-200'
								leaveFrom='opacity-100 translate-y-0 sm:scale-100'
								leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
							>
								<DialogPanel className='relative transform rounded-lg bg-white px-3 pb-2 pt-4 text-left shadow-xl transition-all sm:my-8 sm:p-6 md:w-full lg:w-1/2 m-10 dark:bg-slate-800 dark:text-gray-50'>
									<DialogTitle
										as='h3'
										className='text-lg font-medium text-gray-900 dark:text-white'
									>
										Create a Datasource
									</DialogTitle>
									<div className='pt-4'>
										<CreateDatasourceForm
											compact={true}
											callback={callback}
											models={models}
											spec={spec}
											setSpec={setSpec}
											fetchDatasourceFormData={fetchDatasourceFormData}
											initialStep={initialStep}
										/>
									</div>
								</DialogPanel>
							</TransitionChild>
						</div>
					</div>
				</Dialog>
			</Transition>
		</>
	);
}
