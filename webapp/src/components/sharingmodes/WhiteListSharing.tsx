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
	addNewTitle = '+ New Email'
}) {
	const origin = typeof location !== 'undefined' ? location.origin : '';
	const router = useRouter();
    console.log("emailOptions:", emailOptions)
	const { resourceSlug } = router.query;
	return (
		<>
			<InfoAlert message="Select emails from the dropdown of the people to share this app with. If you wish to share with someone who doesn't have an account, enter their email and they will be sent an email to prompt them to create an account.">
				<div className='flex flex-col'>
					<Select
						value={emailState}
						onChange={(v: any) => {
							if (v?.some(val => val.value === null)) {
								setModalOpen();
								return;
							}
                            //handle empty array
                            if (v === null){
                                onChange([]);
                                return;
                            }
							onChange(v);
						}}
						primaryColor={'indigo'}
						isMultiple
						isSearchable
						placeholder='Select...'
						classNames={SelectClassNames}
						options={[
                                    {
                                        label: addNewTitle,
                                        value: null,
                                        disabled: false
                                    },
                                    {
                                        label: "Suggested members from your team",
                                        options: emailOptions
                                    }
                                ]
						}
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
									<span className='ms-2 w-full overflow-hidden text-ellipsis'>
										{data.label}
									</span>
								</li>
							);
						}}
					/>
					<CopyToClipboardInput dataToCopy={`${origin}/s/${resourceSlug}/${shareLinkShareId}`} />
				</div>
			</InfoAlert>
		</>
	);
}
