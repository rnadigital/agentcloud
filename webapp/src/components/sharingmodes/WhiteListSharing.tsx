import CopyToClipboardInput from 'components/CopyToClipboardInput';
import InfoAlert from 'components/InfoAlert';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import Select from 'react-tailwindcss-select';
import { SelectValue } from 'react-tailwindcss-select/dist/components/type';
import SelectClassNames from 'styles/SelectClassNames';

export default function WhiteListSharing({
	shareLinkShareId,
	enableAddNew = true,
	setModalOpen,
	emailOptions = [],
	emailState = [],
	onChange,
	shareEmail,
	setShareEmail,
	addNewTitle = '+ New Email'
}) {
	const origin = typeof location !== 'undefined' ? location.origin : '';
	const router = useRouter();
	const { resourceSlug } = router.query;
	return (
		<>
			<InfoAlert message="Select emails from the dropdown to share this app. If the person doesn't have an account, enter their email, and they'll receive an invitation email to join.">
				<div className='flex flex-col'>
					<Select
						value={emailState?.length > 0 ? emailState : null}
						onChange={(v: any) => {
							if (v?.some(val => val.value === null)) {
								setModalOpen();
								return;
							}
							if (v === null) {
								onChange([]);
								return;
							}
							onChange(v);
						}}
						primaryColor={'indigo'}
						isMultiple
						isSearchable
						isClearable
						placeholder='Select...'
						classNames={SelectClassNames}
						options={[
							{
								label: addNewTitle,
								value: null,
								disabled: false
							},
							{
								label: 'Suggested members from your team:',
								options: emailOptions
							}
						]}
						formatOptionLabel={data => {
							let optionAccount;
							if (emailOptions) {
								optionAccount = emailOptions.find(account => account.value === data.value);
							}
							return (
								<li
									className={`flex align-items-center !overflow-visible transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 ${
										data.isSelected ? 'bg-blue-100 text-blue-500' : 'dark:text-white'
									}`}
								>
									<span className='ms-2 w-full overflow-hidden text-ellipsis'>{data.label}</span>
								</li>
							);
						}}
						formatGroupLabel={data => {
							return (
								<li className='flex align-items-center !overflow-visible transition duration-200 py-2 cursor-pointer select-none truncate rounded'>
									<span className='border-t pt-3 ms-2 w-full overflow-hidden text-ellipsis'>
										{data.label}
									</span>
								</li>
							);
						}}
					/>
					{/* <div className='pt-3'>
						<label
							htmlFor='sendNotification'
							className='select-none flex items-center text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
						>
							<input
								type='checkbox'
								id='sendNotificaiton'
								name='sendNotificaiton'
								checked={shareEmail}
								onChange={e => setShareEmail(e.target.checked)}
								className='mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
							/>
							Notify Recipients
						</label>
					</div> */}
					<CopyToClipboardInput dataToCopy={`${origin}/s/${resourceSlug}/${shareLinkShareId}`} />
				</div>
			</InfoAlert>
		</>
	);
}
