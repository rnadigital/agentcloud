import React, { useState } from 'react';
import {
	InformationCircleIcon,
} from '@heroicons/react/20/solid';
import dynamic from 'next/dynamic';
// @ts-ignore
const Markdown = dynamic(() => import('react-markdown'), {
	loading: () => <p className='markdown-content'>Loading...</p>,
	ssr: false,
});
import rehypeRaw from 'rehype-raw';

export default function DynamicForm({ spec }) {

	// console.log('spec:', JSON.stringify(spec, null, '\t'));

	const [formData, setFormData] = useState({});
	const [arrayParams, setArrayParams] = useState([]);
	const [showOptional, setShowOptional] = useState(false);

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleToggleOptionalFields = () => {
		setShowOptional(!showOptional);
	};

	const isFieldRequired = (fieldName) => {
		return spec?.connectionSpecification?.required?.includes(fieldName);
	};

	const fieldTooltip = (field) => {
		return field.description && <span className='tooltip'>
			<span className='text-gray-400 hover:text-gray-600 cursor-pointer'><InformationCircleIcon className='ms-1 h-4 w-4' /></span>
			<span className='tooltiptext'>
				<Markdown
					rehypePlugins={[rehypeRaw as any]}
					className={'markdown-content'}
				>
					{field.description}
				</Markdown>
			</span>
		</span>;
	};

	return (
		<>
			{spec.connectionSpecification.properties && Object.keys(spec.connectionSpecification.properties).map((key) => {
				const field = spec.connectionSpecification.properties[key];
				if (!field.const //filter out consts
					&& isFieldRequired(key)) { //only required
					return (
						<div key={key}>
							<label htmlFor={key} className='block text-sm font-medium text-gray-700'>
								{field.title||key}
								{fieldTooltip(field)}
							</label>
							<input
								type={field.type === 'string' ? 'text' : 'number'}
								name={key}
								id={key}
								required
								className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
								onChange={handleChange}
							/>
						</div>
					);
				}
				return null;
			})}
			<div className='space-y-4'>
				<button type='button' onClick={handleToggleOptionalFields} className='text-indigo-600 hover:text-indigo-900'>
					{showOptional ? 'Hide Optional Fields' : 'Show Optional Fields'}
				</button>
				{showOptional && Object.keys(spec.connectionSpecification.properties).map((key) => {
					const field = spec.connectionSpecification.properties[key];
					if (!field.const //filter out consts
						&& !isFieldRequired(key)) { //non required only
						return (
							<div key={key}>
								<label htmlFor={key} className='block text-sm font-medium text-gray-700'>
									{field.title||key}
									{fieldTooltip(field)}
								</label>
								<input
									type={field.type === 'string' ? 'text' : 'number'}
									name={key}
									id={key}
									className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
									onChange={handleChange}
								/>
							</div>
						);
					}
					return null;
				})}
			</div>
			<button type='submit' className='inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'>
				Submit
			</button>
		</>
	);
}
