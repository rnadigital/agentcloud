import ScriptEditor, { MonacoOnInitializePane } from 'components/Editor';
import InfoAlert from 'components/InfoAlert';
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

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
	runtimeOptions
}) {
	const onInitializePane: MonacoOnInitializePane = (monacoEditorRef, editorRef, model) => { /* noop */ };
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
						<InfoAlert className='w-full mb-1 m-0 p-4 bg-blue-100' message='Parameters are available as the dictionary "args", and your code will run in the body of hello_http:' />
					</h2>
				</div>
				<div className='grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
					<div className='col-span-full grid grid-cols-4'>
						<div className='col-span-2'>
							<ScriptEditor
								height='32.5em'
								code={toolCode}
								setCode={setToolCode}
								editorOptions={{
									stopRenderingLineAfter: 1000,
									fontSize: '12pt',
								}}
								onInitializePane={onInitializePane}
							/>
						</div>
						<div className='col-span-2'>
							<SyntaxHighlighter
								language='python'
								style={style}
								showLineNumbers={true}
								PreTag={PreWithRef}
								customStyle={{ margin: 0, maxHeight: 'unset', height: '40em' }}
							>
								{wrappedCode}
							</SyntaxHighlighter>
						</div>
					</div>
				</div>
			</div>
			<div className='border-gray-900/10'>
				<div className='flex justify-between'>
					<h2 className='text-base font-semibold leading-7 text-gray-900'>
                        requirements.txt
					</h2>
				</div>
				<div className='grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
					<div className='col-span-full'>
						<div className='mt-2'>
							<ScriptEditor
								height='10em'
								code={requirementsTxt}
								setCode={setRequirementsTxt}
								editorOptions={{
									stopRenderingLineAfter: 1000,
									fontSize: '12pt',
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
