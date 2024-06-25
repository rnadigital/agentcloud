'use strict';

import * as API from '@api';
import ButtonSpinner from 'components/ButtonSpinner'; // Import ButtonSpinner
import CreateDatasourceModal from 'components/CreateDatasourceModal';
import ScriptEditor, { MonacoOnInitializePane } from 'components/Editor';
import formatDatasourceOptionLabel from 'components/FormatDatasourceOptionLabel';
import FunctionCard from 'components/FunctionCard';
import InfoAlert from 'components/InfoAlert';
import ParameterForm from 'components/ParameterForm';
import RetrievalStrategyComponent from 'components/RetrievalStrategyComponent';
import FunctionToolForm from 'components/tools/form/FunctionToolForm';
import RagToolForm from 'components/tools/form/RagToolForm';
import ToolDetailsForm from 'components/tools/form/ToolDetailsForm';
import { useAccountContext } from 'context/account';
import { dereferenceSync } from 'dereference-json-schema';
import { WrapToolCode } from 'function/base';
import yaml from 'js-yaml';
import { generateOpenAPIMatchKey } from 'lib/utils/toolsUtils';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Document, OpenAPIClientAxios } from 'openapi-client-axios';
import React, { useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { DatasourceStatus } from 'struct/datasource';
import { BaseOpenAPIParameters, Retriever, ToolType } from 'struct/tool';

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

const tabs = [
	{ name: 'Datasource', href: '#datasource', toolTypes: [ToolType.RAG_TOOL] },
	{ name: 'Source', href: '#source', toolTypes: [ToolType.FUNCTION_TOOL] },
	{ name: 'Parameters', href: '#params', toolTypes: [ToolType.FUNCTION_TOOL] },
];

function classNames(...classes) {
	return classes.filter(Boolean).join(' ');
}

export default function ToolForm({ tool = {}, revisions = [], datasources = [], editing, callback, compact, fetchFormData }: { tool?: any, revisions?: any[], datasources?: any[], editing?: boolean, callback?: Function, compact?: boolean, fetchFormData?: Function }) { //TODO: fix any type

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [currentTab, setCurrentTab] = useState(tabs[0]);
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
				import('react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus')
					.then(mod => setStyle(mod.default));
			}
		}, []);
	} catch (e) {
		console.error(e);
	}

	const onInitializePane: MonacoOnInitializePane = (monacoEditorRef, editorRef, model) => { /* noop */ };
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
				// case ToolType.API_TOOL:
				// 	body.schema = toolAPISchema;
				// 	body.data = {
				// 		...body.data,
				// 		code: '',
				// 		description: toolDescription,
				// 		parameters: {
				// 			type: 'object',
				// 			required: parameters.filter(x => x.required).map(x => x.name.trim()),
				// 			properties: parameters.reduce((acc, par) => {
				// 				acc[par.name.trim()] = {
				// 					type: par.type,
				// 					description: par.description,
				// 				};
				// 				return acc;
				// 			}, {}),
				// 			openAPIMatchKey: selectedOpenAPIMatchKey
				// 		},
				// 	};
				// 	break;
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
				await API.editTool({
					...body,
					toolId: toolState._id,
				}, (res) => {
					if (toolType === ToolType.FUNCTION_TOOL
						&& res?.functionNeedsUpdate === true) {
						toast.info('Tool updating...');
						router.push(`/${resourceSlug}/tools`);
					} else {
						toast.success('Tool updated sucessfully');
					}
				}, (err) => {
					toast.error(err);
					setSubmitting(false);
				}, null);
			} else {
				const addedTool = await API.addTool(body, () => {
					if (toolType === ToolType.FUNCTION_TOOL) {
						toast.info('Tool deploying...');
					} else {
						toast.success('Tool created sucessfully');
					}
					router.push(`/${resourceSlug}/tools`);
				}, (err) => { toast.error(err); }, null);
				callback && addedTool && callback(addedTool._id, body);
			}

		} finally {
			setSubmitting(false); // Set submitting to false
		}
	}

	/*
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
	*/

	useEffect(() => {
		if (toolType == ToolType.FUNCTION_TOOL) {
			setSearchTerm('');
			setFunctionsList(null);
			setInvalidFuns(0);
			setSelectedOpenAPIMatchKey('');
		}
		/* else if (toolType === ToolType.API_TOOL) {
			openApiToParams();
		}*/
	}, [toolType]);

	useEffect(() => {
		const allowedTabs = tabs.filter(t => !t.toolTypes || t.toolTypes.includes(toolType));
   		if (typeof window !== 'undefined') {
   			const hashTab = window.location.hash;
   			const foundTab = allowedTabs.find(t => t.href === hashTab);
   			if (foundTab) {
   				setCurrentTab(foundTab);
   			} else {
   				setCurrentTab(allowedTabs[0]);
   			}
   		}
	}, [toolType]);

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
		<form onSubmit={toolPost} className='flex flex-1 flex-col space-between'>
			<input
				type='hidden'
				name='_csrf'
				value={csrf}
			/>
			<div className='space-y-12'>

				<div className='space-y-6'>

					<ToolDetailsForm
						toolName={toolName}
						setToolName={setToolName}
						toolType={toolType}
						setToolType={setToolType}
						toolDescription={toolDescription}
						setToolDescription={setToolDescription}
						isBuiltin={isBuiltin}
						ToolType={ToolType}
					/>

					<div>
						<div className='sm:hidden'>
							<label htmlFor='tabs' className='sr-only'>
					          Select a tab
							</label>
							<select
								id='tabs'
								name='tabs'

  						        className='block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'

  								          	onChange={(e) => {
									setCurrentTab(tabs.find(t => t.name === e.target.value));
								}}
								defaultValue={currentTab.name}
							>
								{tabs
									.filter(tab => !tab.toolTypes || tab.toolTypes?.includes(toolType))
									.map((tab) => (
										<option key={tab.name}>{tab.name}</option>
									))
								}
							</select>
						</div>
						<div className='hidden sm:block'>
	        <div className='border-b border-gray-200'>
	          <nav className='-mb-px flex space-x-8' aria-label='Tabs'>
									{tabs
										.filter(tab => !tab.toolTypes || tab.toolTypes?.includes(toolType))
										.map((tab) => (
											<a
												key={tab.name}
												href={tab.href}
												onClick={(e) => {
													setCurrentTab(tabs.find(t => t.name === tab.name));
												}}
												className={classNames(
													currentTab.name === tab.name
													                    ? 'border-indigo-500 text-indigo-600'
	                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
	                  'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium',
												)}
												aria-current={currentTab.name === tab.name ? 'page' : undefined}
											>
												{tab.name}
											</a>
										))
									}
								</nav>
							</div>
						</div>
					</div>				

					{toolType === ToolType.RAG_TOOL && currentTab?.name === 'Datasource' && <>
						<div className='sm:col-span-12'>
	                        <RagToolForm
	                            datasourceState={datasourceState}
	                            setDatasourceState={setDatasourceState}
	                            datasources={datasources}
	                            setModalOpen={setModalOpen}
	                        />
						
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

					{toolType === ToolType.FUNCTION_TOOL && !isBuiltin &&  currentTab?.name === 'Source' && <>
						<FunctionToolForm
							toolCode={toolCode}
							setToolCode={setToolCode}
							requirementsTxt={requirementsTxt}
							setRequirementsTxt={setRequirementsTxt}
							runtimeState={runtimeState}
							setRuntimeState={setRuntimeState}
							wrappedCode={wrappedCode}
							style={style}
							PreWithRef={PreWithRef}
							isBuiltin={isBuiltin}
							runtimeOptions={runtimeOptions}
							revisions={revisions}
						/>
					</>}

					{/*functionsList && (
                        <FunctionListForm
							...
                        />
                    )*/}

					{toolType === ToolType.FUNCTION_TOOL && currentTab?.name === 'Parameters' && <>
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
			<div className='mt-auto pt-6 flex items-center justify-between gap-x-6'>
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
