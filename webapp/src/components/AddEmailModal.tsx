'use strict';

import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import ButtonSpinner from 'components/ButtonSpinner';
import { Fragment, useState } from 'react';
import React from 'react';
import { useForm } from 'react-hook-form';

import InputField from './form/InputField';

export default function AddEmailModal({
	open,
	setOpen,
	confirmFunction,
	cancelFunction,
	title,
	callback
}) {
	const {
		handleSubmit,
		formState: { errors }
	} = useForm();
	const [submitting, setSubmitting] = useState(false);
	const [email, setEmail] = useState('');

	async function onSubmit(data) {
		setSubmitting(true);
		try {
			await confirmFunction(email);
		} finally {
			setTimeout(() => setSubmitting(false), 1000);
		}
	}

	return (
		<Transition show={open} as={Fragment}>
			<Dialog as='div' className='relative z-50' onClose={cancelFunction}>
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

				<div className='lg:ms-[288px] fixed inset-0 z-10 overflow-y-auto'>
					<div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
						<TransitionChild
							as={Fragment}
							enter='ease-out duration-300'
							enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
							enterTo='opacity-100 translate-y-0 sm:scale-100'
							leave='ease-in duration-200'
							leaveFrom='opacity-100 translate-y-0 sm:scale-100'
							leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
						>
							<DialogPanel className='relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:p-6 sm:w-full sm:max-w-lg sm:p-6 md:min-w-[400px] dark:bg-slate-800'>
								<div>
									<DialogTitle
										as='h3'
										className='text-lg font-medium leading-6 text-gray-900 dark:text-white'
									>
										{title}
									</DialogTitle>
									<form onSubmit={handleSubmit(onSubmit)}>
										<div className='mt-2'>
											The below email will recieve a prompt to create an account, once the account
											is created they will have access to the app
											<label
												htmlFor='email'
												className='block text-sm font-medium leading-6 text-gray-900 dard:text-slate-400'
											>
												Email
											</label>
											<input
												type='email'
												name='email'
												id='email'
												pattern='.+@.+\..+'
												className='bg-white dark:bg-slate-800 rounded-md border border-gray-300 dark:border-gray-600 w-full h-9 p-1 pl-3 text-gray-500 dark:text-gray-50 disabled:bg-gray-200 text-sm focus:ring-indigo-600'
												onChange={e => {
													setEmail(e.target.value);
												}}
												required
												value={email}
											/>
										</div>
										<div className='mt-4 flex justify-end space-x-2'>
											<button
												type='reset'
												className='inline-flex w-full justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 sm:ml-3 sm:w-auto'
												onClick={() => {
													setSubmitting(false);
													cancelFunction();
												}}
											>
												Cancel
											</button>
											<button
												type='submit'
												className='inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto'
												onClick={async () => {
													// setSubmitting(true);
													// try {
													// 	await confirmFunction(email);
													// } finally {
													// 	setTimeout(() => setSubmitting(false), 1000);
													// }
												}}
											>
												{submitting && <ButtonSpinner className='mt-0.5 me-2' />}
												Submit
											</button>
										</div>
									</form>
								</div>
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
