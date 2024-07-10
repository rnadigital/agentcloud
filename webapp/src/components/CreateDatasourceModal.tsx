import * as API from '@api';
import { Dialog, Transition } from '@headlessui/react';
import CreateDatasourceForm from 'components/CreateDatasourceForm'; // Assuming this component is similar to ModelForm but for datasources
import { useAccountContext } from 'context/account';
import FormContext from 'context/connectorform';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';

export default function CreateDatasourceModal({ open, setOpen, callback, initialStep }) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState({});
	const [error, setError] = useState();
	const { models } = state as any;

	async function fetchDatasourceFormData() {
		await API.getModels({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchDatasourceFormData();
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

				<div className='fixed inset-0 z-10 overflow-y-auto w-full'>
					<div className='flex min-h-full items-end justify-center p-3 text-center sm:items-center sm:p-0 w-full'>
						<Transition.Child
							as={Fragment}
							enter='ease-out duration-300'
							enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
							enterTo='opacity-100 translate-y-0 sm:scale-100'
							leave='ease-in duration-200'
							leaveFrom='opacity-100 translate-y-0 sm:scale-100'
							leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
						>
							<Dialog.Panel className='relative transform rounded-lg bg-white px-3 pb-2 pt-4 text-left shadow-xl transition-all sm:my-8 sm:p-6 md:w-full lg:w-1/2 m-10'>
								<Dialog.Title as='h3' className='text-lg font-medium text-gray-900'>
									Create a Datasource
								</Dialog.Title>
								<div className='pt-4'>
									<CreateDatasourceForm compact={true} callback={callback} models={models} fetchDatasourceFormData={fetchDatasourceFormData} initialStep={initialStep} />
								</div>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
}
