import * as API from '@api';
import SharingModeInfoAlert from 'components/SharingModeInfoAlert';
import WhiteListSharing from 'components/sharingmodes/WhiteListSharing';
import SubscriptionModal from 'components/SubscriptionModal';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { pricingMatrix } from 'struct/billing';
import { ShareLinkTypes } from 'struct/sharelink';
import { SharingMode } from 'struct/sharing';
import SelectClassNames from 'styles/SelectClassNames';

const sharingModeOptions = [
	{
		label: 'Team Only',
		value: SharingMode.TEAM
	},
	{
		label: 'Public',
		value: SharingMode.PUBLIC
	},
	{
		label: 'Owner & Admins Only',
		value: SharingMode.OWNER
	},
	{
		label: 'Whitelist',
		value: SharingMode.WHITELIST
	}
];

const SharingModeSelect = ({
	title = 'Sharing Mode',
	sharingMode,
	setSharingMode,
	shareLinkShareId,
	setShareLinkShareId,
	showInfoAlert = false,
	emailOptions,
	emailState,
	onChange = undefined,
	setModalOpen = undefined
}) => {
	const [loading, setLoading] = useState(false);
	const [accountContext]: any = useAccountContext();
	const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
	const { csrf, account } = accountContext as any;
	const { stripePlan } = account?.stripe || {};
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
			<SubscriptionModal
				open={subscriptionModalOpen !== false}
				setOpen={setSubscriptionModalOpen}
				title='Upgrade Required'
				text='Public app sharing is only available on the Teams plan or higher.'
				buttonText='Upgrade'
			/>
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
							if (
								v?.value === SharingMode.PUBLIC ||
								v?.value === SharingMode.OWNER ||
								v?.value === SharingMode.WHITELIST
							) {
								if (!pricingMatrix[stripePlan]?.allowFunctionTools) {
									return setSubscriptionModalOpen(true);
								}
								createShareLink();
							} else {
								setShareLinkShareId(null);
							}
							setSharingMode(v ? v.value : null);
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
			{sharingMode == SharingMode.WHITELIST && (
				<div className='col-span-12'>
					<WhiteListSharing
						shareLinkShareId={shareLinkShareId}
						setModalOpen={setModalOpen}
						emailState={emailState}
						emailOptions={emailOptions}
						onChange={onChange}
					/>
				</div>
			)}
			{sharingMode == SharingMode.OWNER && (
				<div className='col-span-12'>
					<SharingModeInfoAlert
						shareLinkShareId={shareLinkShareId}
						message='This app will only be accessible by the creator of the app, team/org admins and team/org owner only.'
					/>
				</div>
			)}
		</>
	);
};

export default SharingModeSelect;
