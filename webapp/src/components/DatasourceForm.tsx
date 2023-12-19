'use strict';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccountContext } from '../context/account';
import { useRouter } from 'next/router';
import * as API from '@api';
import { toast } from 'react-toastify';
import SelectClassNames from 'styles/SelectClassNames';
import getConnectors from 'airbyte/getconnectors';
import Select from 'react-tailwindcss-select';
import DropZone from 'components/DropZone';
import dynamic from 'next/dynamic';
const TailwindForm = dynamic(() => import('components/rjsf'), {
	ssr: false,
});
import validator from '@rjsf/validator-ajv8';
const DynamicForm = dynamic(() => import('components/DynamicForm'), {
	ssr: false,
});

export default function DatasourceForm({ agent = {}, credentials = [], tools=[], groups=[], editing, compact=false, callback, fetchAgentFormData }
	: { agent?: any, credentials?: any[], tools?: any[], groups?: any[], editing?: boolean, compact?: boolean, callback?: Function, fetchAgentFormData?: Function }) { //TODO: fix any types

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [error, setError] = useState();
	const [files, setFiles] = useState(null);

	const [spec, setSpec] = useState(null);
	async function getSpecification(sourceDefinitionId: string) {
		return API.getSpecification({
			sourceDefinitionId,
			resourceSlug,
		}, setSpec, setError, null);
	}

	const [connectors, setConnectors] = useState([]);
	const [connector, setConnector] = useState(null);
	useEffect(() => {
		getConnectors()
			.then(json => setConnectors(json))
			.catch(e => {
				toast.error('Failed to fetch source connector list');
				setConnectors([]);
			});
	}, []);
	const connectorOptions = connectors ? Object.keys(connectors)
		.filter(key => connectors[key]?.connector_type === 'source')
		.map(key => ({
		  value: connectors[key]?.definitionId,
		  label: connectors[key]?.name_oss || 'test',
		  icon: connectors[key]?.iconUrl_oss,
		})) : [];

	async function datasourcePost(e) {
		const body = {
			...e.formData,
			_csrf: csrf,
			connectorId: connector.value,
			connectorName: connector.label,
			resourceSlug,
		};

		console.log(JSON.stringify(body, null, 2));

		if (editing) {			
			// await API.editAgent(agentState._id, body, () => {
			// 	toast.success('Agent Updated');
			// }, setError, null);
		} else {
			const addedDatasource: any = await API.addDatasource(body, () => {
				toast.success('Added datasource');
			}, (res) => {
				toast.error(res);
			}, compact ? null : router);
			callback && addedAgent && callback(addedAgent._id);
		}
	}

	return (<div className='xs:p-5 xs:my-10 sm:p-20 sm:my-20'>

		{!spec?.schema && <>
			<DropZone files={files} setFiles={setFiles} />
		</>}

		{!files && !spec?.schema && <div className='relative my-20'>
			<div className='absolute inset-0 flex items-center' aria-hidden='true'>
				<div className='w-full border-t border-gray-200' />
			</div>
			<div className='relative flex justify-center text-sm font-bold leading-6'>
				<span className='bg-white px-6 text-gray-900'>OR select a data source:</span>
			</div>
		</div>}

		{!files && <span className='flex'>
			<div className='w-full sm:w-1/2 m-auto'>
				<Select
					isClearable
					isSearchable
					loading={connectorOptions.length === 0}
					primaryColor={'indigo'}
					classNames={SelectClassNames}
					value={connector}
					onChange={(v: any) => {
						setConnector(v);
						if (v) {
							getSpecification(v.value);
						} else {
							setSpec(null);
						}
					}}
					options={connectorOptions}
					formatOptionLabel={data => {
						return (<li
							className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 	${
								data.isSelected
									? 'bg-blue-100 text-blue-500'
									: 'dark:text-white'
							}`}
						>
							<span>
								{data.icon && <img
									src={data.icon}
									loading='lazy'
									className='inline-flex me-2 w-4 h-4'
								/>}
								{data.label}
							</span>
						</li>);
					}}
				/>

				{spec?.schema && <TailwindForm
					schema={spec.schema.connectionSpecification}
					validator={validator}
					onSubmit={datasourcePost}
					transformErrors={() => {return [] /*Disable internal validation for now*/}}
					noHtml5Validate
				/>}

			</div>
		</span>}

	</div>);

}
