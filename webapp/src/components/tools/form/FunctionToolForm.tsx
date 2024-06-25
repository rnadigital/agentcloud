import * as API from '@api';
import { Menu, Transition } from '@headlessui/react';
import {
	EllipsisHorizontalIcon,
	TrashIcon
} from '@heroicons/react/20/solid';
import ButtonSpinner from 'components/ButtonSpinner';
import ScriptEditor, { MonacoOnInitializePane } from 'components/Editor';
import InfoAlert from 'components/InfoAlert';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import React, { Fragment, useReducer} from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { toast } from 'react-toastify';
import submittingReducer from 'utils/submittingreducer';

function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

export default function FunctionToolForm({
	toolCode,
	setToolCode,
	requirementsTxt,
	setRequirementsTxt,
	runtimeState,
	setRuntimeState,
	wrappedCode,
	style,
	PreWithRef,
	isBuiltin,
	runtimeOptions,
	revisions,
	fetchFormData,
}) {
	const onInitializePane: MonacoOnInitializePane = (monacoEditorRef, editorRef, model) => { /* noop */ };
	const [deleting, setDeleting] = useReducer(submittingReducer, {});
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext;
	return (
		<>
			<div>
				<label className='text-base font-semibold text-gray-900'>Runtime</label>
				<div>
					<select
						name='runtime'
						className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
						value={runtimeState}
						onChange={(e) => setRuntimeState(e.target.value)}
					>
						{runtimeOptions.map((option) => (
							<option key={option.value} value={option.value}>{option.label}</option>
						))}
					</select>
				</div>
			</div>
			<div className='border-gray-900/10'>
				<div className='flex justify-between'>
					<h2 className='text-base font-semibold leading-7 text-gray-900 w-full'>
                        Python code
					</h2>
				</div>
				<div className='grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
					<div className='col-span-full grid grid-cols-5 space-x-1'>
						<div className='md:col-span-4 col-span-5 rounded-[6px] overflow-hidden'>
							<ScriptEditor
								height='32.5em'
								code={toolCode}
								setCode={setToolCode}
								editorOptions={{
									stopRenderingLineAfter: 1000,
									fontSize: '12pt',
									//@ts-ignore because minimap is a valid option and I don't care what typescript thinks
									minimap: { enabled: false },
						            scrollBeyondLastLine: false,
								}}
								onInitializePane={onInitializePane}
							/>
						</div>
						<div className='md:col-span-1 col-span-5 rounded overflow-hidden'>
						    <ul className='space-y-2'>
						        {revisions.map((revision, index) => (
						            <li key={index} className='flex justify-between items-center bg-white shadow rounded-lg p-2'>
						                <div className='flex-1 truncate'>
						                    <p className='text-sm text-gray-800'><strong>Revision {index + 1}:</strong> {new Date(revision.date).toString()}</p>
						                </div>
						                <div className='flex gap-2'>
						                    <a
						                        onClick={() => {
													toast.warning('Not implemented');
						                        }}
						                        className='p-2 rounded text-white bg-green-500 hover:bg-green-600'
						                        aria-label='Apply/Revert Revision'
						                    >
						                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
						                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 10h12M9 6l6 4-6 4V6z'></path>
						                        </svg>
						                    </a>
						                    <a
						                        onClick={() => {
						                        	setDeleting({ [revision._id]: true });
						                        	try {
														API.deleteToolRevision({
															_csrf: csrf,
															revisionId: revision._id,
															resourceSlug,
														}, () => {
															fetchFormData && fetchFormData();
															toast.success('Revision deleted successfully');
														}, () => {
															toast.error('Error deleting revision');
														}, null);
													} finally {
							                        	setDeleting({ [revision._id]: false });
													}
						                        }}
						                        // disabled={deleting[revision._id]}
						                        className='p-2 rounded text-white bg-red-500 hover:bg-red-600'
						                        aria-label='Delete Revision'
						                    >
						                        {deleting[revision._id] ? <ButtonSpinner size={14} /> : <TrashIcon className='h-5' aria-hidden='true' />}
						                    </a>
						                </div>
						            </li>
						        ))}
						    </ul>
						</div>
						
						{/*<SyntaxHighlighter
								language='python'
								style={style}
								showLineNumbers={true}
								PreTag={PreWithRef}
								customStyle={{ margin: 0, maxHeight: 'unset', height: '40em' }}
							>
								{wrappedCode}
							</SyntaxHighlighter>*/}
					</div>
				</div>
				<InfoAlert className='w-full mt-2 m-0 p-4 bg-blue-100 rounded' message='Parameters are available as the dictionary "args", and your code will run in the body of hello_http:' />
			</div>
			<div className='border-gray-900/10 !mt-3'>
				<div className='flex justify-between'>
					<h2 className='text-base font-semibold leading-7 text-gray-900'>
                        requirements.txt
					</h2>
				</div>
				<div className='grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
					<div className='col-span-full'>
						<div className='mt-2 rounded overflow-hidden'>
							<ScriptEditor
								height='10em'
								code={requirementsTxt}
								setCode={setRequirementsTxt}
								editorOptions={{
									stopRenderingLineAfter: 1000,
									fontSize: '12pt',
									//@ts-ignore because minimap is a valid option and I don't care what typescript thinks
						            minimap: { enabled: false },
						            scrollBeyondLastLine: false,
								}}
								onInitializePane={onInitializePane}
							/>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
