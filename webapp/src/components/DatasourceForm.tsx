'use strict';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccountContext } from '../context/account';
import { useRouter } from 'next/router';
import * as API from '@api';
import { toast } from 'react-toastify';
import SelectClassNames from 'styles/SelectClassNames';
import Select from 'react-tailwindcss-select';
import dynamic from 'next/dynamic';
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

	const [spec, setSpec] = useState(null);
	async function getSpecification(sourceDefinitionId: string) {
		return API.getSpecification({
			sourceDefinitionId,
			resourceSlug,
		}, setSpec, setError, null);
	}

	const [connectors, setConnectors] = useState([]);
	const [connector, setConnector] = useState(null);
	async function getConnectors() {
		//TODO: change
		fetch('https://connectors.airbyte.com/files/generated_reports/connector_registry_report.json')
			.then(response => response.json())
			.then(data => setConnectors(data))
			.catch(e => {
				setConnectors([]);
				console.error(e);
			});
	}
	useEffect(() => {
		getConnectors();
	}, []);
	const connectorOptions = connectors ? Object.keys(connectors)
		.filter(key => connectors[key]?.connector_type === 'source')
		.map(key => ({
		  value: connectors[key]?.definitionId,
		  label: connectors[key]?.name_oss || 'test',
		})) : [];

	async function datasourcePost(e) {
		e.preventDefault();
		const body = {
			_csrf: e.target._csrf.value,
			resourceSlug,
			//TODO
		};
		if (editing) {			
			// await API.editAgent(agentState._id, body, () => {
			// 	toast.success('Agent Updated');
			// }, setError, null);
		} else {
			// const addedAgent: any = await API.addAgent(body, null, setError, compact ? null : router);
			// callback && addedAgent && callback(addedAgent._id);
		}
	}

	return (<>

		<Select
			isClearable
			isSearchable
			loading={connectorOptions.length === 0}
			primaryColor={'indigo'}
			classNames={SelectClassNames}
			value={connector}
			onChange={(v: any) => {
				console.log(v);
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
					{data.label}
				</li>);
			}}
		/>

		{spec?.schema && <form onSubmit={datasourcePost} className='space-y-2'>
			<input
				type='hidden'
				name='_csrf'
				value={csrf}
			/>
	        
			<DynamicForm
				spec={spec.schema}
			/>

			<div className='mt-6 flex items-center justify-between gap-x-6'>
				{!compact && <Link
					className='text-sm font-semibold leading-6 text-gray-900'
					href={`/${resourceSlug}/datasources`}
				>
					Back
				</Link>}
				<button
					type='submit'
					className={`rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${compact ? 'w-full' : ''}`}
				>
						Save
				</button>
			</div>
		</form>}
	</>);

}
