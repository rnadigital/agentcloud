'use strict';

import * as API from '@api';
import ButtonSpinner from 'components/ButtonSpinner';
import ParameterForm from 'components/ParameterForm';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { ObjectId } from 'mongodb';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useRef, useState } from 'react';
import { Option } from 'react-tailwindcss-select/dist/components/type';
import { Controller, ControllerFieldState, ControllerRenderProps, FieldValues, FormProvider, useForm, UseFormStateReturn } from 'react-hook-form';
import { Property } from 'struct/form';
import InputField from 'components/form/InputField';
import { toast } from 'react-toastify';
import { NotificationType } from 'struct/notification';
import Head from 'next/head';
import MultiSelectField from 'components/connectorform/MultiSelectField';
import Select from 'react-tailwindcss-select';
import { SelectValue } from 'react-tailwindcss-select/dist/components/type';
import FormField from 'components/connectorform/FormField';

export interface ApiKeyFormValues{
	name?: '',
	description: '',
	expirationDate: "30",
	ownerId?: ObjectId | string, 
}

export default function ApiKeyForm(){
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext;
	const posthog = usePostHog();
	const [submitting, setSubmitting] = useState(false);
	const {
		watch,
		handleSubmit,
		control,
		register,
		setValue,
		reset,
		formState: { errors, isDirty, isSubmitting, touchedFields, submitCount },
	 	} = useForm<ApiKeyFormValues>();

	const methods = useForm<ApiKeyFormValues>();

	setValue("ownerId", account?._id);


	const onSubmit = async (data: FieldValues) => {
		
		console.log(data);
	};

	if(!control){
		return <Spinner/>
	}


	return(
		<div className='flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8'>
			<FormProvider {...methods}>
			<form onSubmit={handleSubmit(onSubmit)}>
				<div className='w-[30%] py-5'>
					<InputField<ApiKeyFormValues>
						name='name'
						control={control}
						rules={{
							required: 'Name is required',
						}}
						label='Name'
						type='text'
						disabled={false}
					/>
				</div>

				<div className='w-[35%] py-5'>
					<InputField<ApiKeyFormValues>
						name='description'
						control={control}
						rules={{}}
						label='Description'
						type='text'
						disabled={false}
					/>
				</div>

				<div className='flex flex-col w-[15%] my-5'>
					<p>
						FormField
					</p>
					<Controller 
						render={({ field: { onChange, onBlur, value, ref } }) => {
							const options = [
								{
									value: "30",
									label: "30 days"
								},
								{
									value: "60",
									label: "60 days"
								},
								{
									value: "90",
									label: "90 days"
								},
								{
									value: "never",
									label: "never expire"
								},
							]
							const [valueLabel, setValueLabel] = useState("");
							const handleChange = selected => {
								setValueLabel((selected as Option).label)
								onChange((selected as Option).value);
							};
							return (
								<Select 
									options= {options} 
									value={{value, label: valueLabel}} 
									onChange={handleChange} 
									primaryColor={''}
								/>
							)}}
						name="expirationDate"
						control={control}
						/>
				</div>

				<button type='submit'>
					Submit
				</button>
			</form>
			</FormProvider>
		</div>
	);
}
