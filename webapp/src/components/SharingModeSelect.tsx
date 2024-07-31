import * as API from '@api';
import SharingModeInfoAlert from 'components/SharingModeInfoAlert';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { ShareLinkTypes } from 'struct/sharelink';
import { SharingMode } from 'struct/sharing';
import SelectClassNames from 'styles/SelectClassNames';
import { useAccountContext } from 'context/account';

const sharingModeOptions = [
	{
		label: 'Team Only',
		value: SharingMode.TEAM
	},
	{
		label: 'Public',
		value: SharingMode.PUBLIC
	}
];

const SharingModeSelect = ({
	title = 'Sharing Mode',
	sharingMode,
	setSharingMode,
	shareLinkShareId,
	setShareLinkShareId,
	showInfoAlert = false,
}) => {
	const [loading, setLoading] = useState(false);
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	async function createShareLink() {
		setLoading(true);
		try {
			await API.createShareLink(
				{
					_csrf: csrf,
					resourceSlug,
					type: ShareLinkTypes.APP
				},
				res => {
					setShareLinkShareId(res?.shareLinkId || null);
				},
				err => {
					toast.error(err);
				},
				router
			);
		} finally {
			setLoading(false);
		}
	}
	return (
		<>
			<div className='sm:col-span-12'>
				<label
					htmlFor='sharingMode'
					className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
				>
					{title}
				</label>
				<div className='mt-2'>
					<Select
						loading={loading === true}
						primaryColor={'indigo'}
						classNames={SelectClassNames}
						value={sharingModeOptions.find(o => o.value === sharingMode)}
						onChange={(v: any) => {
							setSharingMode(v ? v.value : null);
							if (v?.value === SharingMode.PUBLIC) {
								createShareLink();
							} else {
								setShareLinkShareId(null);
							}
						}}
						options={sharingModeOptions}
						formatOptionLabel={option => {
							return (
								<li
									className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 ${
										option.isSelected ? 'bg-blue-100 text-blue-500' : 'dark:text-white'
									}`}
								>
									{option.label}
								</li>
							);
						}}
					/>
				</div>
			</div>
			{showInfoAlert && sharingMode === SharingMode.PUBLIC && (
				<div className='col-span-12'>
					<SharingModeInfoAlert shareLinkShareId={shareLinkShareId} />
				</div>
			)}
		</>
	);
};

export default SharingModeSelect;
