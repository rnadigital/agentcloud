'use strict';

import ButtonSpinner from 'components/ButtonSpinner'; // Import ButtonSpinner
import CreateDatasourceModal from 'components/CreateDatasourceModal';
import formatDatasourceOptionLabel from 'components/FormatDatasourceOptionLabel';
import InfoAlert from 'components/InfoAlert';
import RetrievalStrategyComponent from 'components/RetrievalStrategyComponent';
import { dereferenceSync } from 'dereference-json-schema';
import { WrapToolCode } from 'function/base';
import yaml from 'js-yaml';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Document, OpenAPIClientAxios } from 'openapi-client-axios';
import React, { useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { DatasourceStatus } from 'struct/datasource';
import { BaseOpenAPIParameters, Retriever, ToolType } from 'struct/tool';

import * as API from '../api';
import ScriptEditor, { MonacoOnInitializePane } from '../components/Editor';
import FunctionCard from '../components/FunctionCard';
import ParameterForm from '../components/ParameterForm';
import { useAccountContext } from '../context/account';
import { generateOpenAPIMatchKey } from '../lib/utils/toolsUtils';

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
import { runtimeOptions } from 'struct/function';

export default function ToolForm({ tool = {}, datasources = [], editing, callback, compact, fetchFormData }: { tool?: any, datasources?: any[], editing?: boolean, callback?: Function, compact?: boolean, fetchFormData?: Function }) { //TODO: fix any type

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [toolState, setToolState] = useState(tool);
	const [debouncedValue, setDebouncedValue] = useState(null);
	const isBuiltin = toolState?.data?.builtin === true;
	const [importOpen, setImportOpen] = useState(false);
	const [importValue, setImportValue] = useState('');
	const [toolCode, setToolCode] = useState(tool?.data?.code || '');
	const [wrappedCode, setWrappedCode] = useState(WrapToolCode(toolCode));
	const [requirementsTxt, setRequirementsTxt] = useState(tool?.data?.requirements || '');
	const [toolAPISchema, setToolAPISchema] = useState(tool?.schema || '');
	const [toolName, setToolName] = useState(tool?.name || tool?.data?.name || '');
	const [toolDescription, setToolDescription] = useState(tool?.data?.description || tool?.description || '');
	const [toolType, setToolType] = useState(tool?.type as ToolType || ToolType.RAG_TOOL);
	const [submitting, setSubmitting] = useState(false); // Add submitting state
	const codeBlockRef = useRef(null);
	useEffect(() => {
		setWrappedCode(WrapToolCode(toolCode));
	}, [toolCode]);
	const PreWithRef = (preProps) => {
		return (
			<pre {...preProps} ref={codeBlockRef} />
		);
	};
	const [ style, setStyle ] = useState(null);
	try {
		useEffect(() => {
			if (!style) {
				import('react-syntax-highlighter/dist/esm/styles/prism/material-dark')
					.then(mod => setStyle(mod.default));
			}
		}, []);
	} catch (e) {
		console.error(e);
	}

	// TODO: move into RetrievalStrategyComponent, keep the setters passed as props
	const [toolRetriever, setToolRetriever] = useState(tool?.retriever_type || Retriever.SELF_QUERY);
	const [toolDecayRate, setToolDecayRate] = useState<number | undefined>(tool?.retriever_config?.decay_rate || 0.5);
	useEffect(() => {
		if (toolRetriever !== Retriever.TIME_WEIGHTED) {
			setToolDecayRate(undefined);
		}
	}, [toolRetriever]);
	const [toolTimeWeightField, setToolTimeWeightField] = useState(tool?.retriever_config?.timeWeightField || null);

	const [authenticationMethodState, setAuthenticationMethod] = useState(authenticationMethods[0].value);
	const [authorizationMethodState, setAuthorizationMethod] = useState(authorizationMethods[0].value);
	const [tokenExchangeMethod, setTokenExchangeMethod] = useState('post'); // todo: array like ^ ?
	const [searchTerm, setSearchTerm] = useState('');

	// Initial state setup for parameters and environment variables
	const initialParameters = tool?.data?.parameters?.properties && Object.entries(tool.data.parameters.properties).reduce((acc, entry) => {
		const [parname, par]: any = entry;
		acc.push({ name: parname, type: par.type, description: par.description, required: tool.data.parameters.required.includes(parname) });
		return acc;
	}, []);
	
	const initialEnvironmentVariables = tool?.data?.environmentVariables && Object.entries(tool.data.environmentVariables).reduce((acc, entry) => {
		const [parname, par]: any = entry;
		acc.push({ name: parname, description: par });
		return acc;
	}, []);
	
	const [parameters, setParameters] = useState(initialParameters || [{ name: '', type: '', description: '', required: false }]);
	const [environmentVariables, setEnvironmentVariables] = useState(initialEnvironmentVariables || [{ name: '', description: '' }]);
	
	const [functionsList, setFunctionsList] = useState(null);
	const [filteredFunctionsList, setFilteredFunctionsList] = useState(null);
	const [invalidFuns, setInvalidFuns] = useState(0);
	const [selectedOpenAPIMatchKey, setSelectedOpenAPIMatchKey] = useState(null);
	const [error, setError] = useState();
	const onInitializePane: MonacoOnInitializePane = (monacoEditorRef, editorRef, model) => { /* noop */ };

	const initialDatasource = datasources.find(d => d._id === tool?.datasourceId);
	const [datasourceState, setDatasourceState]: any = useState(initialDatasource ? { label: initialDatasource.name, value: initialDatasource._id } : null);
	const currentDatasource = datasources.find(d => d._id === datasourceState?.value);

	const [runtimeState, setRuntimeState] = useState(tool?.data?.runtime || runtimeOptions[0].value);

	function handleSearchChange(event) {
		setSearchTerm(event.target.value.toLowerCase());
	}

	async function createDatasourceCallback(createdDatasource) {
		console.log('createDatasourceCallback', createdDatasource);
		await fetchFormData && fetchFormData();
		setDatasourceState({ label: createdDatasource.name, value: createdDatasource.datasourceId });
		setModalOpen(false);
	}
	const [modalOpen, setModalOpen]: any = useState(false);

	async function toolPost(e) {
		e.preventDefault();
		setSubmitting(true); // Set submitting to true
		try {
			const body = {
				_csrf: e.target._csrf.value,
				resourceSlug,
				name: toolName,
				type: toolType,
				data: {
					...tool?.data,
				},
				schema: null,
				datasourceId: datasourceState ? datasourceState.value : null,
				description: toolDescription,
				retriever: toolRetriever,
				retriever_config: {
					...(tool?.retriever_config || {}),
					timeWeightField: toolTimeWeightField,
					decay_rate: toolDecayRate,
				}, // TODO
			};
			switch (toolType) {
				case ToolType.API_TOOL:
					body.schema = toolAPISchema;
					body.data = {
						...body.data,
						code: '',
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
							openAPIMatchKey: selectedOpenAPIMatchKey
						},
					};
					break;
				case ToolType.FUNCTION_TOOL:
					body.data = {
						...body.data,
						code: toolCode,
						requirements: requirementsTxt,
						runtime: runtimeState,
						description: toolDescription,
						environmentVariables: environmentVariables.reduce((acc, par) => {
							if (par.name.trim().length > 0) {
								acc[par.name.trim()] = par.description;
							}
							return acc;
						}, {}),
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
				case ToolType.RAG_TOOL:
					// TODO: anything? or nah
					break;
				default:
					return;
			}
			if (editing) {
				await API.editTool(toolState._id, {
					...body,
					toolId: toolState._id,
				}, () => {
					toast.success('Tool Updated');
				}, (err) => {
					toast.error(err);
					setSubmitting(false);
				}, null);
			} else {
				const addedTool = await API.addTool(body, null, (err) => { toast.error(err); }, compact ? null : router);
				callback && addedTool && callback(addedTool._id, body);
			}
		} finally {
			setSubmitting(false); // Set submitting to false
		}
	}

	async function openApiToParams() {
		const apiOptions: any = {}; // TODO: see if openapi client axios has a typing
		let loadedDocument;
		if (importValue) {
			apiOptions.definition = importValue; // URL import
		} else if (toolAPISchema) {
			try {
				// Try json parse (detect json schema)
				loadedDocument = JSON.parse(toolAPISchema);
			} catch (e) {
				console.warn(e); // just a warning
				// Try yaml parse (detect yaml schema)
				try {
					loadedDocument = yaml.load(toolAPISchema) as Document;
				} catch (e2) {
					console.warn(e2);
				}
			}
			if (!loadedDocument) {
				setFunctionsList(null);
				setInvalidFuns(0);
				setSelectedOpenAPIMatchKey(null);
				return toast.error('Failed to parse OpenAPI schema');
			}
		} else {
			setFunctionsList(null);
			setInvalidFuns(0);
			setSelectedOpenAPIMatchKey(null);
			return;
		}
		if (loadedDocument) {
			apiOptions.definition = loadedDocument;
		}
		let api, client;
		try {
			api = new OpenAPIClientAxios(apiOptions);
			client = await api.init();
		} catch (e) {
			console.warn(e);
			setFunctionsList(null);
			setInvalidFuns(0);
			setSelectedOpenAPIMatchKey(null);
			return toast.error('Failed to parse OpenAPI schema');
		}
		const funs = [];
		let newInvalidFuns = 0;
		client.api.getOperations()
			.filter(op => {
				if (op.summary) {
					return true;
				}
				newInvalidFuns += 1;
				return false;
			})
			.forEach(op => {
				const baseParams = {
					[BaseOpenAPIParameters.BASE_URL]: {
						type: 'string',
						description: 'The request path e.g. https://api.example.com',
					},
					[BaseOpenAPIParameters.PATH]: {
						type: 'string',
						description: 'The request path e.g. /api/v3/whatever',
					},
					[BaseOpenAPIParameters.METHOD]: {
						type: 'string',
						description: 'The request method, e.g. GET or POST',
					}
				};
				const functionProps = op?.parameters?.reduce((acc, par) => {
					acc[par.name] = {
						type: par.schema.type,
						description: `${par.description || ''}, e.g. ${par.schema.example}`,
					};
					return acc;
				}, baseParams) || baseParams;
				funs.push({
					name: op.summary,
					description: `${op.description ? (op.description + '.\n\n') : ''}The ${BaseOpenAPIParameters.PATH} for this function is "${op.path}",` +
						` the ${BaseOpenAPIParameters.METHOD} is "${op.method}", and the ${BaseOpenAPIParameters.BASE_URL} is "${client.api.instance.defaults.baseURL}".`,
					parameters: {
						type: 'object',
						properties: functionProps,
						required: Object.keys(BaseOpenAPIParameters),
					},
					openAPIMatchKey: generateOpenAPIMatchKey(op)
				});
			});
		setInvalidFuns(newInvalidFuns);
		setFunctionsList(funs);
		setSelectedOpenAPIMatchKey(tool?.data?.parameters?.openAPIMatchKey);
	}

	useEffect(() => {
		openApiToParams();
	}, [debouncedValue]);

	useEffect(() => {
		// Set a timeout to update the debounced value after a delay
		const handler = setTimeout(() => {
			setDebouncedValue(toolAPISchema);
		}, 500); // 500ms delay, adjust as needed
		// Clear the timeout if the value changes
		return () => {
			clearTimeout(handler);
		};
	}, [toolAPISchema]); // Only re-run the effect if inputValue changes

	useEffect(() => {
		if (toolType == ToolType.FUNCTION_TOOL) {
			setSearchTerm('');
			setFunctionsList(null);
			setInvalidFuns(0);
			setSelectedOpenAPIMatchKey('');
		} else if (toolType === ToolType.API_TOOL) {
			openApiToParams();
		}
	}, [toolType]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			if (functionsList && searchTerm && searchTerm.length > 0) {
				setFilteredFunctionsList(functionsList.filter(item => item?.name?.toLowerCase()?.includes(searchTerm) || item?.description?.toLowerCase()?.includes(searchTerm)));
			} else if (functionsList) {
				setFilteredFunctionsList(functionsList.map(item => item));
			}
		}, 5000);
		return () => {
			clearTimeout(timeout);
		};
	}, [searchTerm, functionsList]);

	let modal;
	switch (modalOpen) {
		case 'datasource':
			modal = <CreateDatasourceModal
				open={modalOpen !== false}
				setOpen={setModalOpen}
				callback={createDatasourceCallback}
			/>;
			break;
		default:
			modal = null;
			break;
	}

	if (!style) { return null; }

	return (<>
		{modal}
		<form onSubmit={toolPost}>
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
								required
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
								<option value={ToolType.RAG_TOOL}>Datasource RAG</option>
								<option value={ToolType.FUNCTION_TOOL}>Custom code</option>
								{/*<option value={ToolType.API_TOOL}>OpenAPI endpoint</option>*/}
							</select>
						</div>
					</div>}

					<div>
						<label className='text-base font-semibold text-gray-900'>Description</label>
						<p className='text-sm'><strong>Tip:</strong> A verbose and detailed description helps agents to better understand when to use this tool.</p>
						<div>
							<textarea
								required
								readOnly={isBuiltin}
								name='toolName'
								className='w-full mt-1 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
								onChange={e => setToolDescription(e.target.value)}
								rows={3}
								value={toolDescription}
							/>
						</div>
					</div>

					{toolType === ToolType.RAG_TOOL && <>
						<div className='sm:col-span-12'>
							<label className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'>
								Datasources (Optional)
							</label>
						
							<div className='mt-2'>
								<Select
									isSearchable
									primaryColor={'indigo'}
									classNames={{
										menuButton: () => 'flex text-sm text-gray-500 dark:text-slate-400 border border-gray-300 rounded shadow-sm transition-all duration-300 focus:outline-none bg-white dark:bg-slate-800 dark:border-slate-600 hover:border-gray-400 focus:border-indigo-500 focus:ring focus:ring-indigo-500/20',
										menu: 'absolute z-10 w-full bg-white shadow-lg border rounded py-1 mt-1.5 text-sm text-gray-700 dark:bg-slate-700 dark:border-slate-600',
										list: 'dark:bg-slate-700',
										listGroupLabel: 'dark:bg-slate-700',
										listItem: (value?: { isSelected?: boolean }) => `block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded dark:text-white ${value.isSelected ? 'text-white bg-indigo-500' : 'dark:hover:bg-slate-600'}`,
									}}
									value={datasourceState}
									onChange={(v: any) => {
										if (v?.value === null) {
											// Create new pressed
											return setModalOpen('datasource');
										}
										setDatasourceState(v);
										setToolRetriever(Retriever.SELF_QUERY);
									}}
									options={datasources
										.map(t => ({ label: `${t.name} (${t.originalName})`, value: t._id, ...t }))
										.concat([{ label: '+ New Datasource', value: null }])}
									formatOptionLabel={formatDatasourceOptionLabel}
								/>
							</div>
						
							<RetrievalStrategyComponent
								toolRetriever={toolRetriever}
								setToolRetriever={setToolRetriever}
								toolDecayRate={toolDecayRate}
								setToolDecayRate={setToolDecayRate}
								toolTimeWeightField={toolTimeWeightField}
								setToolTimeWeightField={setToolTimeWeightField}
								schema={currentDatasource?.connectionSettings?.syncCatalog}
								currentDatasource={currentDatasource}
							/>
						
						</div>
						
					</>}

					{toolType === ToolType.FUNCTION_TOOL && !isBuiltin && <>
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
											height='40em'
											code={toolCode}
											setCode={setToolCode}
											editorOptions={{
												stopRenderingLineAfter: 1000,
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
											customStyle={{ margin: 0, maxHeight: 'unset', height: '40em', marginLeft: -1 }}
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
												openApiToParams();
											}}
										>Import</button>
										<button
											className='rounded-md bg-slate-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
											onClick={(e) => {
												e.preventDefault();
												setImportOpen(false);
												setImportValue('');
												setFunctionsList(null);
												setInvalidFuns(0);
												setSelectedOpenAPIMatchKey(null);
											}}
										>Cancel</button>
									</div>}
								</span>
							</div>
							<div className='grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
								<div className='col-span-full'>
									<div className='mt-2'>
										<ScriptEditor
											code={toolAPISchema}
											setCode={setToolAPISchema}
											editorOptions={{
												stopRenderingLineAfter: 1000,
											}}
											onInitializePane={onInitializePane}
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
										/>
									</div>
								</div>
								<div>
									<label className='text-base font-semibold text-gray-900'>Client Secret</label>
									<div>
										<input
											type='password'
											className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
										/>
									</div>
								</div>
								<div>
									<label className='text-base font-semibold text-gray-900'>Authorization URL</label>
									<div>
										<input
											type='text'
											className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
										/>
									</div>
								</div>
								<div>
									<label className='text-base font-semibold text-gray-900'>Token URL</label>
									<div>
										<input
											type='text'
											className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
										/>
									</div>
								</div>
								<div>
									<label className='text-base font-semibold text-gray-900'>Scope</label>
									<div>
										<input
											type='text'
											className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
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
										/>
									</div>
								</div>}
							</div>}

						</div>
					</>}

					{functionsList && <div>
						<div className='mb-4'>
							{/* TODO: add a debounce to this filter/search */}
							<label className='text-base font-semibold text-gray-900'>Select an OpenAPI Endpoint:</label>
							<div className='pt-2'>
								<input
									type='text'
									placeholder='Search by name or description...'
									onChange={handleSearchChange}
									value={searchTerm}
									className='p-2 border rounded'
								/>
								{invalidFuns > 0 && <span className='ms-4 rounded-md bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-800'>
									{invalidFuns} endpoint{invalidFuns > 1 ? 's are not shown because they are' : ' is not shown because it is'} missing a <code className='text-xs'>name</code> property in the api definition
								</span>}
							</div>
						</div>
						<div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4'>
							{filteredFunctionsList && filteredFunctionsList
								.map((item, index) => (
									<FunctionCard
										key={`functionList_${index}`}
										{...item}
										highlighted={selectedOpenAPIMatchKey === item.openAPIMatchKey}
										onClickFunction={() => {
											setSelectedOpenAPIMatchKey(item?.openAPIMatchKey);
											setToolName(item?.name);
											setToolDescription(item?.description);
											const functionParameters = item?.parameters?.properties && Object.entries(item.parameters.properties).reduce((acc, entry) => {
												const [parname, par]: any = entry;
												acc.push({ name: parname, type: par.type, description: par.description, required: item.parameters.required.includes(parname) });
												return acc;
											}, []);
											setParameters(functionParameters || []);
										}}
									/>
								))
							}
						</div>
					</div>}

					{toolType !== ToolType.RAG_TOOL && <>
						<ParameterForm 
							readonly={isBuiltin} 
							parameters={parameters} 
							setParameters={setParameters} 
							title='Parameters' 
							disableTypes={false} 
							hideRequired={false} 
							namePlaceholder='Name'
							descriptionPlaceholder='Description'
						/>

						<ParameterForm 
							readonly={isBuiltin} 
							parameters={environmentVariables} 
							setParameters={setEnvironmentVariables} 
							title='Environment Variables' 
							disableTypes={true} 
							hideRequired={true} 
							namePattern='[A-Z][A-Z0-9_]*'
							namePlaceholder='Key must be uppercase seperated by underscores'
							descriptionPlaceholder='Value'
						/>
					</>}

				</div>
			</div>
			<div className='mt-6 flex items-center justify-between gap-x-6'>
				{!compact && <Link
					className='text-sm font-semibold leading-6 text-gray-900'
					href={`/${resourceSlug}/tools`}
				>
					Back
				</Link>}
				{!isBuiltin && <button
					type='submit'
					disabled={submitting}
					className={`flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${compact ? 'w-full' : ''}`}
				>
					{submitting && <ButtonSpinner className='mr-2' />}
					Save
				</button>}
			</div>
		</form>
	</>);
}
