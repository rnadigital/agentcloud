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
	const [oneOfState, setOneOfState] = useState(null);
	const [arrayParamState, setArrayParamState] = useState(null);

	const handleChange = (event, key, index=null) => {
		if (index !== null) {
			const updatedArray = [...formData[key]];
			updatedArray[index] = { ...updatedArray[index], [event.target.name]: event.target.value };
			setFormData({ ...formData, [key]: updatedArray });
		} else {
			setFormData({ ...formData, [key]: event.target.value });
		}
	};

	const handleAddArrayItem = (e, key) => {
		e.preventDefault();
		const updatedArray = formData[key] ? [...formData[key], {}] : [{}];
		setFormData({ ...formData, [key]: updatedArray });
	};

	const handleRemoveArrayItem = (e, key, index) => {
		e.preventDefault();
		const updatedArray = formData[key].filter((_, i) => i !== index);
		setFormData({ ...formData, [key]: updatedArray });
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
				setOneOfState(oldoneOfState => ({
					...oldoneOfState,
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

	const renderArrayField = (key, field) => {
		return (
			<div key={key} className='p-5 border m-4 me-0 rounded space-y-4'>
				{formData[key] && formData[key].map((item, index) => (
					<div key={index} className='ms-2 p-2 border-b'>
						{renderFormFields(field.items.properties, field.items, false, true, index)}
						<button onClick={(e) => handleRemoveArrayItem(e, key, index)} className='mt-4 mb-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'>
							Remove
						</button>
					</div>
				))}
				<button onClick={(e) => handleAddArrayItem(e, key)} className='rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600'>
					Add Item
				</button>
			</div>
		);
	};

	const renderInputField = (key, field, required=false, index=null) => {
		switch (true) {
			case (field.type === 'object' && field.oneOf != null):
				return <>
					{renderOneOfOptions(key, field)}
					{oneOfState
						&& oneOfState[key]
						&& renderFormFields(field.oneOf[parseInt(oneOfState[key])].properties, field.oneOf[parseInt(oneOfState[key])], true)}
				</>;
			case (field.type === 'array' && field?.items?.properties != null):
				return renderArrayField(key, field);
			case field.type === 'boolean':
				return (
					<input
						key={key}
						id={key}
						type='checkbox'
						onChange={(e) => handleChange(e, key, index)}
						className='p-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm'
					/>
				);
			case field.type === 'string':
			case field.type === 'integer':
			default:
				const InputComponent = (field.type !== 'integer' && field.examples != null) ? 'textarea' : 'input';
				return (
					<InputComponent
						key={key}
						id={key}
						type={field.type === 'integer' ? 'number' : 'text'}
						rows={field.examples?.length > 0 && field.examples[0].startsWith('{') ? 5 : 1}
						required={required}
						onChange={(e) => handleChange(e, key, index)}
						className='block w-full p-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm'
					/>
				);
		}
	};

	const renderFormFields = (properties, requiredParent=null, isNested=false, isArray=false, index=null) => {
		const isFieldRequired = (fieldName) => {
			return (requiredParent||spec?.connectionSpecification)?.required?.includes(fieldName);
		};
		return <div className={isNested ? 'p-5 border-l-4 border m-4 me-0 rounded' : ''}>
			{properties && Object.keys(properties).map((key) => {
				const field = properties[key];
				if (!field.const //filter out consts
					&& (isFieldRequired(key) || isNested)) { //only required
					return (
						<div key={key}>
							<label htmlFor={key} className='select-none block text-sm font-medium text-gray-700'>
								{field.title||key}
								{fieldTooltip(field)}
								{renderInputField(key, field, true, index)}
							</label>
						</div>
					);
				}
				return null;
			})}
			{!isNested && <div className='space-y-4'>
				{!isArray && <button type='button' onClick={handleToggleOptionalFields} className='mt-4 mb-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'>
					{showOptional ? 'Hide Optional Fields' : 'Show Optional Fields'}
				</button>}
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
								{renderInputField(key, field, false, index)}
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
