import {
	Description,
	Dialog,
	DialogDescription,
	DialogPanel,
	DialogTitle,
	Transition,
	TransitionChild
} from '@headlessui/react';
import { title } from 'process';
import { Fragment, useState } from 'react';

interface ModalProps {
	isOpen: boolean;
	close: () => void;
	children: React.ReactNode;
	title?: string;
	description?: string;
}

function Modal({ children, isOpen, close, title, description }: ModalProps) {
	return (
		<>
			<Transition show={isOpen} as={Fragment}>
				<Dialog onClose={close} className='relative z-50'>
					<TransitionChild
						as={Fragment}
						enter='ease-out duration-300'
						enterFrom='opacity-0'
						enterTo='opacity-100'
						leave='ease-in duration-200'
						leaveFrom='opacity-100'
						leaveTo='opacity-0'
					>
						<div className='fixed inset-0 bg-black/30' aria-hidden='true' />
					</TransitionChild>

					<div className='fixed inset-0 flex items-center justify-center p-4'>
						<TransitionChild
							as={Fragment}
							enter='ease-out duration-300'
							enterFrom='opacity-0 scale-95'
							enterTo='opacity-100 scale-100'
							leave='ease-in duration-200'
							leaveFrom='opacity-100 scale-100'
							leaveTo='opacity-0 scale-95'
						>
							<DialogPanel className='mx-auto max-w-md rounded bg-white p-6'>
								<DialogTitle>{title}</DialogTitle>
								<Description>{description}</Description>
								{children}
							</DialogPanel>
						</TransitionChild>
					</div>
				</Dialog>
			</Transition>
		</>
	);
}

export default Modal;
