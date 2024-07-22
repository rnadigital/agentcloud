import * as API from '@api';
import { Menu, Transition } from '@headlessui/react';
import { ArrowUturnLeftIcon, EllipsisHorizontalIcon, TrashIcon } from '@heroicons/react/20/solid';
import ButtonSpinner from 'components/ButtonSpinner';
import ScriptEditor, { MonacoOnInitializePane } from 'components/Editor';
import InfoAlert from 'components/InfoAlert';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import React, { Fragment, useReducer } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { toast } from 'react-toastify';
import { ToolState } from 'struct/tool';
import submittingReducer from 'utils/submittingreducer';

function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

export default function FunctionRevisionForm({ revisions, tool, fetchFormData }) {
	const [deleting, setDeleting] = useReducer(submittingReducer, {});
	const [submitting, setSubmitting] = useReducer(submittingReducer, {});
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext;
	return (
		<div className='space-y-3'>
			{tool?.state === ToolState.PENDING && (
				<InfoAlert
					textColor='black'
					className='rounded bg-orange-300 p-4'
					message='A deployment is currently in progress for this tool'
				/>
			)}
			{tool?.functionLogs && (
				<InfoAlert
					textColor='black'
					className='rounded bg-orange-300 p-4'
					message={<span className='whitespace-pre break-all'>{tool?.functionLogs}</span>}
				/>
			)}
			{revisions.map((revision, index) => {
				const currentRevision = revision._id.toString() === tool?.revisionId?.toString();
				return (
					<li key={index} className='flex justify-between items-center bg-white shadow rounded p-2'>
						<div className='flex-1 truncate'>
							<p className='text-sm text-gray-800 truncate'>
								Version {revision._id.slice(-6)} - {new Date(revision.date).toLocaleString()}
							</p>
						</div>
						{currentRevision ? (
							<strong>(Current)</strong>
						) : (
							<div className='flex gap-2'>
								<a
									onClick={() => {
										if (submitting[revision._id]) {
											return;
										}
										setSubmitting({ [revision._id]: true });
										try {
											API.applyToolRevision(
												{
													_csrf: csrf,
													revisionId: revision._id,
													resourceSlug
												},
												() => {
													// fetchFormData && fetchFormData();
													toast.info('Tool updating...');
													router.push(`/${resourceSlug}/tools`);
												},
												() => {
													toast.error('Error applying revision');
												},
												null
											);
										} finally {
											setDeleting({ [revision._id]: false });
										}
									}}
									className={`cursor-pointer p-1 rounded text-white bg-indigo-500 hover:bg-indigo-600 ${submitting[revision._id] ? 'opacity-90' : ''}`}
									aria-label='Apply/Revert Revision'
								>
									{submitting[revision._id] ? (
										<ButtonSpinner className='ms-1' size={14} />
									) : (
										<ArrowUturnLeftIcon className='h-4 m-1' aria-hidden='true' />
									)}
								</a>
								<a
									onClick={() => {
										if (deleting[revision._id]) {
											return;
										}
										setDeleting({ [revision._id]: true });
										try {
											API.deleteToolRevision(
												{
													_csrf: csrf,
													revisionId: revision._id,
													resourceSlug
												},
												() => {
													fetchFormData && fetchFormData();
													toast.success('Revision deleted successfully');
												},
												() => {
													toast.error('Error deleting revision');
												},
												null
											);
										} finally {
											setDeleting({ [revision._id]: false });
										}
									}}
									className={`cursor-pointer p-1 rounded text-white bg-red-500 hover:bg-red-600 ${deleting[revision._id] ? 'opacity-90' : ''}`}
									aria-label='Delete Revision'
								>
									{deleting[revision._id] ? (
										<ButtonSpinner className='ms-1' size={14} />
									) : (
										<TrashIcon className='h-4 m-1' aria-hidden='true' />
									)}
								</a>
							</div>
						)}
					</li>
				);
			})}
		</div>
	);
}
