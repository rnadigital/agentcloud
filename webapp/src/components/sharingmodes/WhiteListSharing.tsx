import CopyToClipboardInput from 'components/CopyToClipboardInput';
import InfoAlert from 'components/InfoAlert';
import { useRouter } from 'next/router';
import React from 'react';
import Select from 'react-tailwindcss-select';
import { SelectValue } from 'react-tailwindcss-select/dist/components/type';
import SelectClassNames from 'styles/SelectClassNames';

export default function WhiteListSharing({
	shareLinkShareId,
	enableAddNew = true,
	setModalOpen,
	accounts = [],
	onChange,
	addNewTitle = '+ New Email'
}) {
	const setAccountsToOptions = (accounts: any[]) => {
		accounts.forEach(acc => {
			return { value: acc, label: acc };
		});
		return accounts;
		console.log(accounts);
	};
	const origin = typeof location !== 'undefined' ? location.origin : '';
	const router = useRouter();
	const { resourceSlug } = router.query;
	const accountOptionFormat = accounts ? setAccountsToOptions(accounts) : [];
	console.log(accountOptionFormat);
	return (
		<>
			<InfoAlert message="Select accounts from the dropdown of the people to share this app with. If you wish to share with someone who doesn't have an account, enter their email and they will be sent an email to prompt them to create an account.">
				<div className='flex flex-col'>
					<Select
						value={accountOptionFormat}
						onChange={(v: any) => {
							// if (v?.some(val => val?.disabled)) { return; }
							if (v?.some(val => val.value === null)) {
								setModalOpen();
								return;
							}
							onChange(v);
						}}
						primaryColor={'indigo'}
						isMultiple
						isSearchable
						placeholder='Select...'
						classNames={SelectClassNames}
						options={
							enableAddNew
								? [
										{
											label: addNewTitle,
											value: null,
											disabled: false
										}
									]
								: accountOptionFormat
						}
						formatOptionLabel={data => {
							let optionAccount;
							if (accounts) {
								optionAccount = accounts.find(account => account.value === data.value);
							}
							return (
								<li
									className={`flex align-items-center !overflow-visible transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 ${
										data.isSelected ? 'bg-blue-100 text-blue-500' : 'dark:text-white'
									}`}
								>
									<span className='ms-2 w-full overflow-hidden text-ellipsis'>
										{data.label}
										{optionAccount
											? ` - ${optionAccount?.data?.description || optionAccount?.description}`
											: ''}
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
