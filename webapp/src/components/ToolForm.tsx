'use strict';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAccountContext } from '../context/account';
// import toSnakeCase from '../lib/misc/tosnakecase';
import { ToolType } from '../lib/struct/tools';
import { useRouter } from 'next/router';
import * as API from '../api';
import { toast } from 'react-toastify';
import OpenAPIClientAxios from 'openapi-client-axios';
import ParameterForm from '../components/ParameterForm';
import ScriptEditor, { MonacoOnInitializePane } from '../components/Editor';

const authenticationMethods = [
	{ label: 'None', value: 'none' },
	{ label: 'API Key', value: 'api' },
	{ label: 'Oauth', value: 'oauth' },
];

const authorizationMethods = [
	{ label: 'Basic', value: 'basic' },
	{ label: 'Bearer', value: 'bearer' },
	{ label: 'Custom', value: 'custom' },
];

export default function ToolForm({ tool = {}, credentials = [], editing }: { tool?: any, credentials?: any[], editing?: boolean }) { //TODO: fix any type

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const resourceSlug = account?.currentTeam;

	const router = useRouter();
	const [toolState, setToolState] = useState(tool); // TODO: remove?
	const isBuiltin = toolState?.data?.builtin === true;
	const [importOpen, setImportOpen] = useState(false);
	const [importValue, setImportValue] = useState('');
	const [toolCode, setToolCode] = useState(tool?.data?.code || '');
	const [toolName, setToolName] = useState(tool?.data?.name || '');
	const [toolDescription, setToolDescription] = useState(tool?.data?.description || '');
	const [toolType, setToolType] = useState(tool?.type as ToolType || ToolType.HOSTED_FUNCTION_TOOL);
	const [authenticationMethodState, setAuthenticationMethod] = useState(authenticationMethods[0].value);
	const [authorizationMethodState, setAuthorizationMethod] = useState(authorizationMethods[0].value);
	const [tokenExchangeMethod, setTokenExchangeMethod] = useState('post'); //todo: array like ^ ?
	const initialParameters = tool?.data?.parameters?.properties && Object.entries(tool.data.parameters.properties).reduce((acc, entry) => {
		const [parname, par]: any = entry;
		acc.push({ name: parname, type: par.type, description: par.description, required: tool.data.parameters.required.includes(parname) });
		return acc;
	}, []);
	const [parameters, setParameters] = useState(initialParameters || [{ name: '', type: '', description: '', required: false }]);
	const [functionsList, setFunctionsList] = useState(null);
	const [error, setError] = useState();
	
	// Instantiate Monaco Editor

	const onInitializePane: MonacoOnInitializePane = (
		monacoEditorRef,
		editorRef,
		model
	) => {
    // editorRef.current.setScrollTop(1)
    // editorRef.current.setPosition({
    //   lineNumber: 2,
    //   column: 0,
    // })
		editorRef.current.focus();
    // monacoEditorRef.current.setModelMarkers(model[0], 'owner', null)
	};

	async function toolPost(e) {
		e.preventDefault();
		const body = {
			_csrf: e.target._csrf.value,
			name: toolName,
			type: toolType,
			data: null,
		};
		switch (toolType) {
			case ToolType.API_TOOL:
				body.data = {
					//TODO
				};
				break;
			case ToolType.HOSTED_FUNCTION_TOOL:
				body.data = {
					code: toolCode,
					description: toolDescription,
					parameters: {
						type: 'object',
						required: parameters.filter(x => x.required).map(x => x.name.trim()),
						properties: parameters.reduce((acc, par) => {
							acc[par.name.trim()] = {
								type: par.type,
								description: par.description,
							};
							return acc;
						}, {}),
					},
				};
				break;
			default:
				return;
		}
		if (editing) {
			await API.editTool(toolState._id, body, () => {
				toast.success('Tool Updated');
			}, setError, null);
		} else {
			API.addTool(body, null, setError, router);
		}
	}

	return (<form onSubmit={toolPost}>
		<input
			type='hidden'
			name='_csrf'
			value={csrf}
		/>
		<div className='space-y-12'>
		
			<div className='space-y-6'>
				<div>
					<label className='text-base font-semibold text-gray-900'>Name</label>
					<div>
						<input
							readOnly={isBuiltin}
							type='text'
							name='toolName'
							className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
							onChange={e => setToolName(e.target.value)}
							value={toolName}
						/>
						{/*<p className='text-sm text-gray-900'>
							{toolName && `Function name: ${toSnakeCase(toolName)}`}
						</p>*/}
					</div>
				</div>
				<div>
					<label className='text-base font-semibold text-gray-900'>Description</label>
					<p className='text-sm'><strong>Tip:</strong> A verbose and detailed description helps agents to better understand when to use this tool.</p>
					<div>
						<textarea
							readOnly={isBuiltin}
							name='toolName'
							className='w-full mt-1 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
							onChange={e => setToolDescription(e.target.value)}
							rows={3}
							value={toolDescription}
						/>
					</div>
				</div>
				{!isBuiltin && <div>
					<label className='text-base font-semibold text-gray-900'>Tool Type</label>
					<div>
						<select
							required
							name='toolType'
							className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:ring-slate-600 dark:text-white'
							value={toolType}
							onChange={(e) => setToolType(e.target.value as ToolType)}
						>
							<option value={ToolType.HOSTED_FUNCTION_TOOL}>Custom code</option>
							<option disabled value={ToolType.API_TOOL}>OpenAPI endpoint (coming soon)</option>
						</select>
					</div>
				</div>}

				{toolType === ToolType.HOSTED_FUNCTION_TOOL && !isBuiltin && <>
					<div className='border-gray-900/10'>
						<div className='flex justify-between'>
							<h2 className='text-base font-semibold leading-7 text-gray-900'>
								Python code
							</h2>
						</div>
						<div className='grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
							<div className='col-span-full'>
								<div className='mt-2'>
									<ScriptEditor
										code={toolCode}
										setCode={setToolCode}
										editorOptions={{
											stopRenderingLineAfter: 1000,
										}}
										onInitializePane={onInitializePane}
									/>
								</div>
							</div>
						</div>
					</div>					
				</>}

				{/* api call tool */}
				{toolType === ToolType.API_TOOL && <>
					<div className='border-gray-900/10'>
						<div className='flex justify-between'>
							<h2 className='text-base font-semibold leading-7 text-gray-900'>
								Schema
							</h2>
							<span>
								{!importOpen && <button
									className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
									onClick={(e) => {
										e.preventDefault();
										setImportOpen(true);
									}}
								>Import from URL</button>}
								{importOpen && <div className='flex items-center gap-2'>
									<input
										type='text'
										className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
										onChange={e => setImportValue(e.target.value)}
										value={importValue}
										placeholder='https://api.example.com/specification.json'
									/>
									<button
										className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
										onClick={async (e) => {
											e.preventDefault();
											//NOTE: just for testing on client side, converting imported url into autogen function params
											const api = new OpenAPIClientAxios({ definition: importValue });
											const client = await api.init();
											const funs = [];
											client.api.getOperations().forEach(op => {
												const baseParams = {
													__baseurl: {
														type: 'string',
														description: 'The request path e.g. https://api.example.com',
													},
													__path: {
														type: 'string',
														description: 'The request path e.g. /api/v3/whatever',
													},
													__method: {
														type: 'string',
														description: 'The request method, e.g. GET or POST',
													}
												};
												const functionProps = op?.parameters?.reduce((acc, par: any) => {
													acc[par.name] = {
														type: par.schema.type,
														description: `${par.description||''}, e.g. ${par.schema.example}`,
													};
													return acc;
												}, baseParams);
												funs.push({
													name: op.summary,
													description: `${op.description}. The __path for this function is "${op.path}", the __method is "${op.method}", and the __baseurl is "${client.api.instance.defaults.baseURL}".`,
													parameters: {
														type: 'object',
														properties: functionProps,
														required: ['__baseurl', '__path', '__method'],
													}
												});
											});
											setFunctionsList(funs);
										}}
									>Import</button>
									<button
										className='rounded-md bg-slate-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
										onClick={(e) => {
											e.preventDefault();
											setImportOpen(false);
											setImportValue('');
											setFunctionsList(null);
										}}
									>Cancel</button>
								</div>}
							</span>
						</div>
						<div className='grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
							<div className='col-span-full'>

								<div className='mt-2'>
									<textarea
										name='schema'
										rows={3}
										className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
										placeholder={'OpenAPI schema...'}
										defaultValue={''}
									/>
								</div>
							</div>
						</div>
					</div>

					<div className='border-gray-900/10'>
						<div>
							<label className='text-base font-semibold text-gray-900'>Authentication</label>
							<fieldset className='mt-2'>
								<div className='space-y-4 sm:flex sm:items-center sm:space-x-10 sm:space-y-0'>
									{authenticationMethods.map((authenticationMethod) => (
										<div key={authenticationMethod.value} className='flex items-center'>
											<input
												id={authenticationMethod.value}
												value={authenticationMethod.value}
												name='authenticationMethod'
												type='radio'
												onChange={e => setAuthenticationMethod(e.target.value)}
												defaultChecked={authenticationMethod.value === authenticationMethodState}
												className='h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600'
											/>
											<label htmlFor={authenticationMethod.value} className='ml-3 block text-sm font-medium leading-6 text-gray-900'>
												{authenticationMethod.label}
											</label>
										</div>
									))}
								</div>
							</fieldset>
						</div>

						{/* api key authentication */}
						{authenticationMethodState === 'api' && <div className='mt-4 flex flex-col space-y-3'>
							<div>
								<label className='text-base font-semibold text-gray-900'>API Key</label>
								<div>
									<input
										type='text'
										className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
										// onChange={e => setImportValue(e.target.value)}
										// value={importValue}
									/>
								</div>
							</div>
							<div>
								<label className='text-base font-semibold text-gray-900'>Authorization</label>
								<fieldset className='mt-2'>
									<div className='space-y-4 sm:flex sm:items-center sm:space-x-10 sm:space-y-0'>
										{authorizationMethods.map((authorizationMethod) => (
											<div key={authorizationMethod.value} className='flex items-center'>
												<input
													id={authorizationMethod.value}
													value={authorizationMethod.value}
													name='authorizationMethod'
													type='radio'
													onChange={e => setAuthorizationMethod(e.target.value)}
													defaultChecked={authorizationMethod.value === authorizationMethodState}
													className='h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600'
												/>
												<label htmlFor={authorizationMethod.value} className='ml-3 block text-sm font-medium leading-6 text-gray-900'>
													{authorizationMethod.label}
												</label>
											</div>
										))}
									</div>
								</fieldset>
							</div>
							{authorizationMethodState === 'custom' && <div>
								<label className='text-base font-semibold text-gray-900'>Custom Header Name</label>
								<div>
									<input
										type='text'
										className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
										placeholder='X-Api-Token'
										// onChange={e => setImportValue(e.target.value)}
										// value={importValue}
									/>
								</div>
							</div>}
						</div>}

						{/* oauth authentication */}
						{authenticationMethodState === 'oauth' && <div className='mt-4 flex flex-col space-y-3'>
							<div>
								<label className='text-base font-semibold text-gray-900'>Client ID</label>
								<div>
									<input
										type='password'
										className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
										// onChange={e => setImportValue(e.target.value)}
										// value={importValue}
									/>
								</div>
							</div>
							<div>
								<label className='text-base font-semibold text-gray-900'>Client Secret</label>
								<div>
									<input
										type='password'
										className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
										// onChange={e => setImportValue(e.target.value)}
										// value={importValue}
									/>
								</div>
							</div>
							<div>
								<label className='text-base font-semibold text-gray-900'>Authorization URL</label>
								<div>
									<input
										type='text'
										className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
										// onChange={e => setImportValue(e.target.value)}
										// value={importValue}
									/>
								</div>
							</div>
							<div>
								<label className='text-base font-semibold text-gray-900'>Token URL</label>
								<div>
									<input
										type='text'
										className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
										// onChange={e => setImportValue(e.target.value)}
										// value={importValue}
									/>
								</div>
							</div>
							<div>
								<label className='text-base font-semibold text-gray-900'>Scope</label>
								<div>
									<input
										type='text'
										className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
										// onChange={e => setImportValue(e.target.value)}
										// value={importValue}
									/>
								</div>
							</div>
							<div>
								<label className='text-base font-semibold text-gray-900'>Token Exchange Method</label>
								<fieldset className='mt-2'>
									<div className='space-y-4 sm:flex sm:items-center sm:space-x-10 sm:space-y-0'>
										<div className='flex items-center'>
											<input
												id='post'
												value='post'
												name='tokenExchangeMethod'
												type='radio'
												onChange={e => setAuthorizationMethod(e.target.value)}
												defaultChecked={tokenExchangeMethod === 'post'}
												className='h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600'
											/>
											<label htmlFor='post' className='ml-3 block text-sm font-medium leading-6 text-gray-900'>
												POST request (default)
											</label>
										</div>
										<div className='flex items-center'>
											<input
												id='basic'
												value='basic'
												name='tokenExchangeMethod'
												type='radio'
												onChange={e => setAuthorizationMethod(e.target.value)}
												defaultChecked={tokenExchangeMethod === 'basic'}
												className='h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600'
											/>
											<label htmlFor='post' className='ml-3 block text-sm font-medium leading-6 text-gray-900'>
												Basic authorization header
											</label>
										</div>
									</div>
								</fieldset>
							</div>
							{authorizationMethodState === 'custom' && <div>
								<label className='text-base font-semibold text-gray-900'>Custom Header Name</label>
								<div>
									<input
										type='text'
										className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
										placeholder='X-Api-Token'
										// onChange={e => setImportValue(e.target.value)}
										// value={importValue}
									/>
								</div>
							</div>}
						</div>}					
						
					</div>
				</>}

				{functionsList && <div className='border-gray-900/10'>
					<pre>{JSON.stringify(functionsList, null, 2)}</pre>
				</div>}

				<ParameterForm readonly={isBuiltin} parameters={parameters} setParameters={setParameters} />

			</div>
		</div>
		<div className='mt-6 flex items-center justify-between gap-x-6'>
			<Link
				className='text-sm font-semibold leading-6 text-gray-900'
				href={`/${resourceSlug}/tools`}
			>
				Back
			</Link>
			{!isBuiltin && <button
				type='submit'
				className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
			>
				Save
			</button>}
		</div>
	</form>);

}
