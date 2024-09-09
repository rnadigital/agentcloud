import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useRef, useState } from 'react';
import { Variable } from 'struct/variable';

interface SessionVariableModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	variables: Variable[];
	onSubmit: (variableValues: { [key: string]: string }) => void;
}

export default function SessionVariableModal({
	open,
	setOpen,
	variables,
	onSubmit
}: SessionVariableModalProps) {
	const [variableValues, setVariableValues] = useState<{ [key: string]: string }>({});
	const cancelButtonRef = useRef(null);

	const handleVariableChange = (id: string, value: string) => {
		setVariableValues(prev => ({ ...prev, [id]: value }));
	};

	const handleSubmit = () => {
		onSubmit(variableValues);
		setOpen(false);
	};

	return (
		<Transition.Root show={open} as={Fragment}>
			<Dialog as='div' className='relative z-10' initialFocus={cancelButtonRef} onClose={setOpen}>
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
							<Dialog.Panel className='relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6'>
								<div>
									<div className='mt-3 text-center sm:mt-5'>
										<Dialog.Title as='h3' className='text-lg font-medium leading-6 text-gray-900'>
											Enter Variable Values
										</Dialog.Title>
										<div className='mt-2'>
											{variables.map(variable => (
												<div key={variable._id.toString()} className='mt-4'>
													<label
														htmlFor={variable._id.toString()}
														className='block text-sm font-medium text-gray-700'
													>
														{variable.name}
													</label>
													<input
														type='text'
														name={variable._id.toString()}
														id={variable._id.toString()}
														value={variableValues[variable._id.toString()] || ''}
														onChange={e =>
															handleVariableChange(variable._id.toString(), e.target.value)
														}
														className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
													/>
												</div>
											))}
										</div>
									</div>
								</div>
								<div className='mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3'>
									<button
										type='button'
										className='inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm'
										onClick={handleSubmit}
									>
										Submit
									</button>
									<button
										type='button'
										className='mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm'
										onClick={() => setOpen(false)}
										ref={cancelButtonRef}
									>
										Cancel
									</button>
								</div>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
}
