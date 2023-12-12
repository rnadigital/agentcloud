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

	console.log('spec:', JSON.stringify(spec, null, '\t'));

	const [formData, setFormData] = useState({});
	const [arrayParams, setArrayParams] = useState([]);
	const [showOptional, setShowOptional] = useState(false);
	const [selectedOneOf, setSelectedOneOf] = useState(null);

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleToggleOptionalFields = () => {
		setShowOptional(!showOptional);
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

	const renderOneOfOptions = (key, field) => {
		return (
			<select onChange={(e) => {
				setSelectedOneOf(oldSelectedOneOf => ({
					...oldSelectedOneOf,
					[key]: e.target.value,
				}));
			}} className='block w-full p-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm'>
				<option value=''>Select an Option</option>
				{field.oneOf.map((option, index) => (
					<option key={index} value={index}>{option.title}</option>
				))}
			</select>
		);
	};

	const renderInputField = (key, field, required = false) => {
		console.log(key, field);
		switch (true) {
			case (field.type === 'object' && field.oneOf != null):
				return <>
					{renderOneOfOptions(key, field)}
					{selectedOneOf
						&& selectedOneOf[key]
						&& renderFormFields(field.oneOf[parseInt(selectedOneOf[key])].properties, field.oneOf[parseInt(selectedOneOf[key])], true)}
				</>;
			case field.type === 'boolean':
				return (
					<input
						key={key}
						id={key}
						type='checkbox'
						onChange={(e) => handleChange(e)}
						className='block p-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm'
					/>
				);
			case field.type === 'string':
			case field.type === 'integer':
			default:
				const InputComponent = field.examples != null ? 'textarea' : 'input';
				return (
					<InputComponent
						key={key}
						id={key}
						rows={field.examples?.length > 0 && field.examples[0].startsWith('{') ? 5 : 1}
						required={required}
						type={field.type}
						onChange={(e) => handleChange(e)}
						className='block w-full p-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm'
					/>
				);
		}
	};

	const renderFormFields = (properties, requiredParent=null, nested=false) => {
		const isFieldRequired = (fieldName) => {
			return (requiredParent||spec?.connectionSpecification)?.required?.includes(fieldName);
		};
		return <div className={nested ? 'p-5 border-l-4 border m-4 me-0 rounded' : ''}>
			{properties && Object.keys(properties).map((key) => {
				const field = properties[key];
				if (!field.const //filter out consts
					&& (isFieldRequired(key) || nested)) { //only required
					return (
						<div key={key}>
							<label htmlFor={key} className='select-none block text-sm font-medium text-gray-700'>
								{field.title||key}
								{fieldTooltip(field)}
							</label>
							{renderInputField(key, field, true)}
						</div>
					);
				}
				return null;
			})}
			{!nested && <div className='space-y-4'>
				<button type='button' onClick={handleToggleOptionalFields} className='text-indigo-600 hover:text-indigo-900'>
					{showOptional ? 'Hide Optional Fields' : 'Show Optional Fields'}
				</button>
				{showOptional && Object.keys(properties).map((key) => {
					const field = properties[key];
					if (!field.const //filter out consts
						&& !isFieldRequired(key)) { //non required only
						return (
							<div key={key}>
								<label htmlFor={key} className='select-none block text-sm font-medium text-gray-700'>
									{field.title||key}
									{fieldTooltip(field)}
								</label>
								{renderInputField(key, field)}
							</div>
						);
					}
					return null;
				})}
			</div>}
		</div>;
	};

	return renderFormFields(spec.connectionSpecification.properties, spec.connectionSpecification, false);

}
