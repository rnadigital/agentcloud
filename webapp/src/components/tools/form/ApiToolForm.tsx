import ScriptEditor, { MonacoOnInitializePane } from 'components/Editor';
import React from 'react';

export default function ApiToolForm({
	importOpen,
	setImportOpen,
	importValue,
	setImportValue,
	toolAPISchema,
	setToolAPISchema,
	authenticationMethodState,
	setAuthenticationMethod,
	authorizationMethodState,
	setAuthorizationMethod,
	tokenExchangeMethod,
	setTokenExchangeMethod,
	authenticationMethods,
	authorizationMethods
}) {
	const onInitializePane: MonacoOnInitializePane = (monacoEditorRef, editorRef, model) => {
		/* noop */
	};
	/*
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
	*/
	return (
		<>
			<div className='border-gray-900/10'>
				<div className='flex justify-between'>
					<h2 className='text-base font-semibold leading-7 text-gray-900'>Schema</h2>
					<span>
						{!importOpen && (
							<button
								className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
								onClick={e => {
									e.preventDefault();
									setImportOpen(true);
								}}
							>
								Import from URL
							</button>
						)}
						{importOpen && (
							<div className='flex items-center gap-2'>
								<input
									type='text'
									className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
									onChange={e => setImportValue(e.target.value)}
									value={importValue}
									placeholder='https://api.example.com/specification.json'
								/>
								<button
									className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
									onClick={e => {
										e.preventDefault();
										// Placeholder for the API import functionality
									}}
								>
									Import
								</button>
								<button
									className='rounded-md bg-slate-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
									onClick={e => {
										e.preventDefault();
										setImportOpen(false);
										setImportValue('');
									}}
								>
									Cancel
								</button>
							</div>
						)}
					</span>
				</div>
				<div className='grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
					<div className='col-span-full'>
						<div className='mt-2'>
							<ScriptEditor
								code={toolAPISchema}
								setCode={setToolAPISchema}
								editorOptions={{
									stopRenderingLineAfter: 1000
								}}
								onInitializePane={onInitializePane}
							/>
						</div>
					</div>
				</div>
			</div>

			<div>
				<label className='text-base font-semibold text-gray-900'>Authentication</label>
				<fieldset className='mt-2'>
					<div className='space-y-4 sm:flex sm:items-center sm:space-x-10 sm:space-y-0'>
						{authenticationMethods.map(authenticationMethod => (
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
								<label
									htmlFor={authenticationMethod.value}
									className='ml-3 block text-sm font-medium leading-6 text-gray-900'
								>
									{authenticationMethod.label}
								</label>
							</div>
						))}
					</div>
				</fieldset>
			</div>

			{/* api key authentication */}
			{authenticationMethodState === 'api' && (
				<div className='mt-4 flex flex-col space-y-3'>
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
								{authorizationMethods.map(authorizationMethod => (
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
										<label
											htmlFor={authorizationMethod.value}
											className='ml-3 block text-sm font-medium leading-6 text-gray-900'
										>
											{authorizationMethod.label}
										</label>
									</div>
								))}
							</div>
						</fieldset>
					</div>
					{authorizationMethodState === 'custom' && (
						<div>
							<label className='text-base font-semibold text-gray-900'>Custom Header Name</label>
							<div>
								<input
									type='text'
									className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
									placeholder='X-Api-Token'
								/>
							</div>
						</div>
					)}
				</div>
			)}

			{/* oauth authentication */}
			{authenticationMethodState === 'oauth' && (
				<div className='mt-4 flex flex-col space-y-3'>
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
									<label
										htmlFor='post'
										className='ml-3 block text-sm font-medium leading-6 text-gray-900'
									>
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
									<label
										htmlFor='post'
										className='ml-3 block text-sm font-medium leading-6 text-gray-900'
									>
										Basic authorization header
									</label>
								</div>
							</div>
						</fieldset>
					</div>
					{authorizationMethodState === 'custom' && (
						<div>
							<label className='text-base font-semibold text-gray-900'>Custom Header Name</label>
							<div>
								<input
									type='text'
									className='w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6'
									placeholder='X-Api-Token'
								/>
							</div>
						</div>
					)}
				</div>
			)}
		</>
	);
}
