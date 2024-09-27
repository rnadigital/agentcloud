import * as API from '@api';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { CreditCardIcon } from '@heroicons/react/24/outline';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { Fragment, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function SubscriptionModal({
	open,
	setOpen,
	title = 'Upgrade Required',
	text,
	buttonText = 'Upgrade',
	enterprise = false
}: {
	open: boolean;
	setOpen: Function;
	title: string;
	text: string;
	buttonText?: string;
	enterprise?: boolean;
}) {
	const [accountContext]: any = useAccountContext();
	const { csrf, account } = accountContext as any;
	const { name, email, stripePlan } = account || {};
	const router = useRouter();
	const posthog = usePostHog();

	useEffect(() => {
		if (open !== false) {
			posthog.capture('upgradeModal', {
				name,
				email,
				stripePlan,
				text,
				...(typeof open === 'string' ? { trigger: open } : {})
			});
		}
	}, [open]);

	return (
		<Transition show={open !== false} as={Fragment}>
			<Dialog as='div' className='relative z-50' onClose={() => setOpen(false)}>
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

				<div className='lg:ms-[144px] fixed inset-0 z-10 w-screen overflow-y-auto'>
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
							<DialogPanel className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6 md:min-w-[400px] dark:bg-slate-800'>
								<div>
									<div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100'>
										<CreditCardIcon className='h-6 w-6 text-yellow-600' aria-hidden='true' />
									</div>
									<div className='mt-3 text-center sm:mt-5'>
										<DialogTitle
											as='h3'
											className='text-base font-semibold leading-6 text-gray-900 dark:text-white'
										>
											{title}
										</DialogTitle>
										<div className='mt-2'>
											<p className='text-sm text-gray-500'>{text}</p>
										</div>
									</div>
								</div>
								{enterprise ? (
									<div className='flex gap-3'>
										<div className='mt-5 sm:mt-6 w-full'>
											<Link
												target='_blank'
												type='button'
												className='inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
												href='https://www.agentcloud.dev/contact'
											>
												Contact us
											</Link>
										</div>
										<div className='mt-5 sm:mt-6 w-full'>
											<Link
												target='_blank'
												type='button'
												className='inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
												href={process.env.NEXT_PUBLIC_HUBSPOT_MEETING_LINK}
											>
												Book a meeting
											</Link>
										</div>
									</div>
								) : (
									<div className='mt-5 sm:mt-6'>
										<Link
											type='button'
											className='inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
											href='/billing'
										>
											{buttonText}
										</Link>
									</div>
								)}
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
