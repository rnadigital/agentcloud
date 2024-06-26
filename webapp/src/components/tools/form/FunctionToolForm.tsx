import * as API from '@api';
import { Menu, Transition } from '@headlessui/react';
import {
	ArrowUturnLeftIcon,
	EllipsisHorizontalIcon,
	TrashIcon,
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
	tool,
	fetchFormData,
}) {
	const onInitializePane: MonacoOnInitializePane = (monacoEditorRef, editorRef, model) => { /* noop */ };
	const [deleting, setDeleting] = useReducer(submittingReducer, {});
	const [submitting, setSubmitting] = useReducer(submittingReducer, {});
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
					<div className='col-span-full grid grid-cols-6 space-x-1'>
						<div className='md:col-span-4 col-span-6 rounded-[6px] overflow-hidden'>
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
						<div className='md:col-span-2 col-span-6 rounded overflow-hidden'>
						    <ul className='space-y-2'>
						        {revisions.map((revision, index) => (
						            <li key={index} className='flex justify-between items-center bg-white shadow rounded p-2'>
						                <div className='flex-1 truncate'>
						                    <p className='text-sm text-gray-800 truncate'>Version {index+1} - {new Date(revision.date).toLocaleString()}</p>
						                </div>
						                <div className='flex gap-2'>
						                    <a
						                        onClick={() => {
						                        	if (submitting[revision._id]) { return; }
						                        	setSubmitting({ [revision._id]: true });
						                        	try {
														API.applyToolRevision({
															_csrf: csrf,
															revisionId: revision._id,
															resourceSlug,
														}, () => {
															// fetchFormData && fetchFormData();
															toast.success('Tool updating...');
															router.push(`/${resourceSlug}/tools`);
														}, () => {
															toast.error('Error applying revision');
														}, null);
													} finally {
							                        	setDeleting({ [revision._id]: false });
													}
												}}
						                        className={`cursor-pointer p-1 rounded text-white bg-indigo-500 hover:bg-indigo-600 ${submitting[revision._id] ? 'opacity-90' : ''}`}
						                        aria-label='Apply/Revert Revision'
						                    >
						                        {submitting[revision._id] ? <ButtonSpinner className='ms-1' size={14} /> : <ArrowUturnLeftIcon className='h-4 m-1' aria-hidden='true' />}
						                    </a>
						                    <a
						                        onClick={() => {
						                        	if (deleting[revision._id]) { return; }
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
						                        className={`cursor-pointer p-1 rounded text-white bg-red-500 hover:bg-red-600 ${deleting[revision._id] ? 'opacity-90' : ''}`}
						                        aria-label='Delete Revision'
						                    >
						                        {deleting[revision._id] ? <ButtonSpinner className='ms-1' size={14} /> : <TrashIcon className='h-4 m-1' aria-hidden='true' />}
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
